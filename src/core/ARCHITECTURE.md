# YouthCare Connect - Quiz Engine Architecture

## Overview

This document describes the modular quiz engine architecture for YouthCare Connect, a digital reproductive health and wellness platform for rural Rwandan youth (ages 13-24).

## Design Goals

1. **Modularity** - Reusable components that can be recombined for different quiz types
2. **Scalability** - Support for 50+ quizzes without rewriting core logic
3. **Maintainability** - Clear separation of concerns for long-term maintenance
4. **Privacy** - Anonymous participation with localStorage-first approach
5. **Safety** - Built-in safety checks and crisis resource integration

## Folder Structure

```
src/
├── core/                    # Core engine modules
│   ├── index.js           # Module exports
│   ├── state.js           # State management
│   ├── events.js          # Event system
│   ├── persistence.js     # localStorage layer
│   ├── scoring.js         # Scoring engine
│   ├── schema.js          # Validation schemas
│   └── adaptive.js        # Adaptive flow logic
│
├── quizzes/               # Quiz definitions and renderers
│   ├── registry.js       # Quiz registry
│   ├── definitions.js   # Quiz definitions (10 quizzes)
│   └── renderers.js      # Step rendering functions
│
├── services/              # Services
│   └── QuizEngine.js     # Main quiz engine
│
└── styles/                # CSS (future)
```

## Core Modules

### 1. State Management (`src/core/state.js`)

**Purpose**: Immutable state management with history tracking

**Key Components**:
- `QuizState.create(definition)` - Creates isolated state instance per quiz
- `StateFactory` - Manages multiple quiz state instances

**Features**:
- Immutable state snapshots
- Answer history for undo/redo
- Step navigation (next/prev/jump)
- Progress calculation
- Serialization for persistence

```javascript
// Usage
const state = QuizState.create(quizDefinition);
state.recordAnswer('step-id', { value: 'my-answer' });
state.nextStep();
const progress = state.getProgress(); // 0-100
const snapshot = state.getState(); // Immutable copy
```

### 2. Event System (`src/core/events.js`)

**Purpose**: Isolated event handling per quiz instance

**Key Components**:
- `QuizEvents.createEmitter(instanceId)` - Creates isolated emitter
- `EventBus` - Global event bus for cross-component communication
- `QuizEventTypes` - Standardized event constants

**Event Types**:
- `quiz:start`, `quiz:complete`, `quiz:abort`
- `step:enter`, `step:exit`, `step:submit`
- `answer:change`, `answer:submit`
- `safety:check`, `safety:alert`

```javascript
// Usage
const emitter = QuizEvents.createEmitter('quiz-123');
emitter.on('quiz:complete', (data) => {
  console.log('Quiz completed:', data.results);
});
emitter.emit('quiz:start', { quizId: 'mood-checkin' });
```

### 3. Persistence Layer (`src/core/persistence.js`)

**Purpose**: localStorage-based persistence with session recovery

**Key Components**:
- `StorageSystem.Storage` - Low-level storage operations
- `ProgressManager` - Tracks quiz completion
- `SessionManager` - Handles active session recovery
- `SettingsManager` - User preferences
- `AnalyticsManager` - Engagement tracking

**Features**:
- Automatic session recovery on page reload
- Progress tracking across quizzes
- Analytics event history (max 200 events)
- Storage quota management

```javascript
// Usage
SessionManager.saveSession('quiz-id', state, definition);
const session = SessionManager.getSession('quiz-id');
if (session) {
  // Resume quiz
}

ProgressManager.isCompleted('quiz-id'); // true/false
```

### 4. Scoring Engine (`src/core/scoring.js`)

**Purpose**: Modular scoring with multiple strategies

**Key Components**:
- `ScoreCalculator.calculate(answers, definition)` - Main scoring entry
- `QuizScoring.ScorerFactory` - Creates appropriate scorer
- Scorer classes: SimpleScorer, WeightedScorer, AssessmentScorer, KnowledgeScorer

**Scorer Types**:
- `simple` - Basic percentage scoring
- `weighted` - Weighted question values
- `assessment` - For wellness assessments (non-binary)
- `knowledge` - For trivia/educational quizzes
- `custom` - Custom scorer function in definition

```javascript
// Usage
const results = ScoreCalculator.calculate(answers, quizDefinition);
// Returns: { score, maxScore, percentage, level, message, suggestions }

// Custom scorer in definition
{
  scorerType: 'custom',
  scorer: (answers, def) => { /* custom logic */ }
}
```

### 5. Validation & Schema (`src/core/schema.js`)

**Purpose**: Validate quiz definitions and user input

**Key Components**:
- `Validator.validateQuiz(quiz)` - Validate definition at load time
- `RuntimeValidator.validateAnswer(step, answer)` - Validate during quiz
- `QuizSchema.StepTypes` - Supported step types

**Validation**:
- Quiz definition validation (type, required fields, patterns)
- Step answer validation (required, format, length)
- Completion readiness check

### 6. Adaptive Flow (`src/core/adaptive.js`)

**Purpose**: Dynamic quiz flow based on user responses

**Key Components**:
- `FlowEngine` - Handles dynamic navigation
- `SkipLogic` - Determines skipped questions
- `FlowAnalyzer` - Analyzes quiz paths

**Features**:
- Conditional question skipping
- Branching scenarios
- Path analysis for quizzes

```javascript
// Adaptive config in step definition
{
  id: 'stress-level',
  adaptive: {
    skipIf: { from: '$.previous-step', operator: 'equals', value: 'none' },
    branches: {
      'high': 'high-stress-support',
      'low': 'continue'
    }
  }
}
```

## Quiz Definition Schema

```javascript
{
  id: 'unique-quiz-id',           // Required, lowercase alphanumeric
  title: 'Quiz Title',            // Required, 3-100 chars
  description: 'Description',     // Required, 10-500 chars
  category: 'mental',             // Required: mental|reproductive|relationship|lifestyle
  categoryLabel: 'Mental Wellness',
  duration: '5 min',              // Optional
  difficulty: 'intermediate',      // Optional: beginner|intermediate|advanced
  xpReward: 25,                   // Optional, default 10
  icon: '🔥',                     // Optional emoji
  color: '#F59E0B',               // Optional hex color
  scorerType: 'assessment',       // Optional: simple|weighted|assessment|knowledge
  steps: [ /* Step definitions */ ]
}
```

## Step Types

| Type | Description | Scoring |
|------|-------------|---------|
| `mood-select` | Emoji-based mood selection | Assessment |
| `text-input` | Free text response | No score |
| `likert` | 1-5 scale rating | Assessment |
| `multi-select` | Multiple choice (single) | Weighted |
| `checkbox` | Multiple selection | Weighted |
| `true-false` | Binary choice | Knowledge |
| `multiple-choice` | Multiple choice | Knowledge |
| `scenario` | Scenario with multiple options | Custom |
| `results` | Results display step | N/A |
| `completion` | Simple completion step | N/A |

## Integration Flow

```
1. Include scripts (order matters):
   - src/quizzes/registry.js
   - src/quizzes/definitions.js
   - src/quizzes/renderers.js
   - src/core/index.js
   - src/services/QuizEngine.js

2. Initialize engine:
   const engine = new QuizEngine({ xpEnabled: true });

3. Launch quiz:
   engine.launchQuiz('burnout-check');

4. Handle events:
   engine.on('quiz:complete', (data) => {
     console.log('Results:', data.results);
   });
```

## Safety Features

1. **Content Safety**: Automatic detection of concerning text in user input
2. **Crisis Resources**: Built-in emergency contacts (112, crisis hotline)
3. **Privacy First**: All data stored locally, no personal information required
4. **Stigma-Free**: Questions designed with supportive, non-judgmental language
5. **Age Appropriate**: Content suitable for 13-24 year olds

## Future Considerations

1. **Multilingual Support**: Schema supports i18n keys for translation
2. **Voice Compatibility**: Step structure designed for voice input
3. **API Integration**: Scoring abstracted for future server-side calculation
4. **Analytics Export**: AnalyticsManager supports data export for NGO reporting
5. **Telehealth Integration**: Architecture supports future counselor integration

## Best Practices

1. Always validate quiz definitions before registration
2. Use `RuntimeValidator` for user input validation
3. Save session periodically during long quizzes
4. Emit events for analytics tracking
5. Handle safety concerns with appropriate resources

## File Dependencies

```
QuizEngine.js
    ├── requires: QuizRegistry (quizzes/registry.js)
    ├── requires: StepRenderers (quizzes/renderers.js)
    ├── requires: Core modules (core/index.js)
    └── provides: window.QuizEngine

core/index.js (exports all core modules)
    ├── state.js
    ├── events.js
    ├── persistence.js
    ├── scoring.js
    ├── schema.js
    └── adaptive.js
```

## API Reference

### QuizEngine
- `launchQuiz(quizId, params)` - Start a quiz
- `getQuizList()` - Get all available quizzes
- `getProgress(quizId)` - Get completion status
- `getIncompleteSessions()` - Get unfinished quizzes
- `resumeSession(quizId)` - Resume saved session
- `on(event, callback)` - Subscribe to events

### Core Modules
- `QuizState.create(definition)` - Create state instance
- `ScoreCalculator.calculate(answers, definition)` - Calculate score
- `Validator.validateQuiz(quiz)` - Validate definition
- `SessionManager.getSession(quizId)` - Get saved session

---
*Architecture v1.0 - YouthCare Connect Platform*