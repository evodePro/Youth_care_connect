/**
 * YouthCare Connect - Core Module Index
 * Central export for all core engine modules
 * 
 * Usage:
 * import { QuizState, EventBus, StorageSystem, ... } from './core/index.js';
 */

// Core modules
window.QuizState = QuizState;
window.StateFactory = StateFactory;
window.QuizEvents = QuizEvents;
window.EventBus = EventBus;
window.QuizEventTypes = QuizEventTypes;
window.EventMiddleware = EventMiddleware;

// Storage modules
window.QuizPersistence = QuizPersistence;
window.StorageSystem = StorageSystem;
window.ProgressManager = ProgressManager;
window.SessionManager = SessionManager;
window.SettingsManager = SettingsManager;
window.AnalyticsManager = AnalyticsManager;

// Scoring modules
window.QuizScoring = QuizScoring;
window.ScoreCalculator = ScoreCalculator;

// Schema modules
window.QuizSchema = QuizSchema;
window.Validator = Validator;
window.RuntimeValidator = RuntimeValidator;

// Adaptive flow modules
window.AdaptiveFlow = AdaptiveFlow;
window.FlowEngine = FlowEngine;

/**
 * Core Module Exports Summary:
 * 
 * State Management:
 * - QuizState.create(definition) - Create isolated state instance
 * - StateFactory - Manage multiple state instances
 * 
 * Event System:
 * - QuizEvents.createEmitter(instanceId) - Create isolated emitter
 * - EventBus - Global event bus for cross-component comms
 * - QuizEventTypes - Standardized event name constants
 * - EventMiddleware - Add cross-cutting concerns
 * 
 * Persistence:
 * - StorageSystem.Storage - Low-level storage operations
 * - ProgressManager - Quiz completion tracking
 * - SessionManager - Active session management
 * - SettingsManager - User preferences
 * - AnalyticsManager - Engagement tracking
 * 
 * Scoring:
 * - ScoreCalculator.calculate(answers, definition) - Calculate final score
 * - QuizScoring.ScorerFactory - Create appropriate scorer
 * 
 * Validation:
 * - Validator.validateQuiz(quiz) - Validate definition at load time
 * - RuntimeValidator.validateAnswer(step, answer) - Validate during quiz
 * 
 * Adaptive Flow:
 * - FlowEngine - Handle dynamic navigation
 * - SkipLogic - Determine skipped questions
 * - FlowAnalyzer - Analyze quiz paths
 */

console.log('YouthCare Connect - Core modules loaded');