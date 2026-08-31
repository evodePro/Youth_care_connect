/**
 * YouthCare Connect - Modular Quiz Engine (Refactored)
 * Production-grade wellness assessment system
 * 
 * Architecture:
 * - Core module integration (state, events, persistence, scoring)
 * - Registry-based quiz loading
 * - Isolated state per quiz instance
 * - Reusable UI components
 * - Safety-first design
 * - Accessibility compliant
 * 
 * Dependencies: src/core/* (state, events, persistence, scoring, schema, adaptive)
 */

class QuizEngine {
  constructor(options = {}) {
    this.options = {
      containerSelector: '#quiz-modal-content',
      overlayId: 'quiz-engine-overlay',
      xpEnabled: true,
      saveProgress: true,
      analyticsEnabled: true,
      ...options
    };
    
    this.activeQuiz = null;
    this.modal = null;
    this.emitter = null;
    this.flowEngine = null;
    
    this.init();
  }

  /**
   * Initialize the quiz engine with core modules
   */
  init() {
    // Initialize core modules
    this.modal = new QuizModal(this.options.overlayId);
    this.safetyInterceptor = new SafetyInterceptor();
    
    // Create instance ID for event isolation
    this.instanceId = 'engine_' + Date.now().toString(36);
    this.emitter = QuizEvents.createEmitter(this.instanceId);
    
    // Register default event handlers
    this.registerDefaultListeners();
  }

  /**
   * Register default event listeners using core EventBus
   */
  registerDefaultListeners() {
    // Quiz lifecycle events
    this.emitter.on(QuizEventTypes.QUIZ_START, (data) => {
      AnalyticsManager.track('quiz_started', data);
    });

    this.emitter.on(QuizEventTypes.QUIZ_COMPLETE, (data) => {
      AnalyticsManager.track('quiz_completed', data);
      
      // Award XP on completion
      if (this.options.xpEnabled && data.xp) {
        this.awardXP(data.xp);
      }
      
      // Save progress
      if (this.options.saveProgress) {
        ProgressManager.save(data.quizId, {
          completed: true,
          score: data.results?.score,
          percentage: data.results?.percentage,
          timestamp: Date.now()
        });
      }
    });

    this.emitter.on(QuizEventTypes.STEP_ENTER, (data) => {
      AnalyticsManager.track('step_entered', data);
    });

    this.emitter.on(QuizEventTypes.SAFETY_ALERT, (data) => {
      this.handleSafetyAlert(data);
    });
  }

  /**
   * Launch a quiz by ID from the registry
   */
  launchQuiz(quizId, params = {}) {
    const quizDef = QuizRegistry.get(quizId);
    
    if (!quizDef) {
      console.error(`Quiz not found: ${quizId}`);
      this.emitter.emit(QuizEventTypes.ERROR, { 
        type: 'quiz_not_found', 
        quizId 
      });
      return;
    }

    // Validate quiz definition using core schema
    const validationErrors = Validator.validateQuiz(quizDef);
    if (validationErrors.length > 0) {
      console.error('Quiz definition validation errors:', validationErrors);
      this.emitter.emit(QuizEventTypes.ERROR, {
        type: 'validation_error',
        errors: validationErrors
      });
      return;
    }

    // Create state using core state management
    const state = StateFactory.create(quizId, quizDef);
    
    // Create adaptive flow engine
    this.flowEngine = new FlowEngine(quizDef);

    // Check for existing session to resume
    const session = SessionManager.getSession(quizId);
    if (session && !session.state.completedAt) {
      const shouldResume = confirm('You have an unfinished quiz. Would you like to continue?');
      if (shouldResume) {
        state.restore(JSON.stringify(session.state));
      } else {
        SessionManager.removeSession(quizId);
      }
    }

    this.activeQuiz = {
      id: quizId,
      definition: quizDef,
      state: state,
      params
    };

    // Emit quiz start event
    this.emitter.emit(QuizEventTypes.QUIZ_START, { 
      quizId, 
      title: quizDef.title,
      timestamp: Date.now()
    });

    this.renderCurrentStep();
  }

  /**
   * Render the current step using core state
   */
  renderCurrentStep() {
    if (!this.activeQuiz) return;

    const state = this.activeQuiz.state;
    const definition = this.activeQuiz.definition;
    const stepInfo = state.getStepInfo();
    const currentStepDef = state.getCurrentStep();

    if (!currentStepDef) {
      this.handleQuizComplete();
      return;
    }

    // Emit step enter event
    this.emitter.emit(QuizEventTypes.STEP_ENTER, {
      quizId: this.activeQuiz.id,
      stepId: currentStepDef.id,
      stepNumber: stepInfo.current,
      totalSteps: stepInfo.total
    });

    // Get renderer for step type
    const stepRenderer = StepRenderers.get(currentStepDef.type);
    
    // Prepare step config
    const stepConfig = {
      ...currentStepDef,
      stepInfo,
      definition
    };

    // Render step
    const stepContent = stepRenderer(this, stepConfig, state.getState());

    this.modal.open(stepContent, (container) => {
      this.bindStepEvents(container, currentStepDef);
    });

    // Save session periodically
    if (this.options.saveProgress) {
      this.saveSession();
    }
  }

  /**
   * Bind events for the current step
   */
  bindStepEvents(container, stepConfig) {
    const form = container.querySelector('[data-form]');
    
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleStepSubmit(form, stepConfig);
      });
    }

    // Action buttons
    container.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        this.handleAction(action, btn, stepConfig);
      });
    });
  }

  /**
   * Handle step submission
   */
  handleStepSubmit(form, stepConfig) {
    const formData = new FormData(form);
    let answers = Object.fromEntries(formData.entries());

    // Handle checkboxes specially
    if (stepConfig.type === 'multi-select' || stepConfig.type === 'checkbox' || stepConfig.type === 'scenario') {
      const selected = form.querySelectorAll('input:checked');
      answers = { 
        options: Array.from(selected).map(input => input.value) 
      };
    }

    // Run safety check if enabled
    if (stepConfig.safetyCheck) {
      const safetyResult = this.safetyInterceptor.checkAnswer(answers);
      if (safetyResult.hasConcern) {
        this.emitter.emit(QuizEventTypes.SAFETY_ALERT, safetyResult);
        this.showSafetyScreen();
        return;
      }
    }

    // Validate answer using core validator
    const validation = RuntimeValidator.validateAnswer(stepConfig, answers);
    if (!validation.valid) {
      this.showValidationError(validation.errors);
      return;
    }

    // Record answer in state
    this.activeQuiz.state.recordAnswer(stepConfig.id, answers);

    // Emit answer submit event
    this.emitter.emit(QuizEventTypes.ANSWER_SUBMIT, {
      quizId: this.activeQuiz.id,
      stepId: stepConfig.id,
      answers
    });

    // Handle custom onSubmit if defined
    if (stepConfig.onSubmit) {
      stepConfig.onSubmit(this, answers);
    }

    // Move to next step
    this.nextStep();
  }

  /**
   * Handle action buttons
   */
  handleAction(action, btn, stepConfig) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'prev':
        this.prevStep();
        break;
      case 'finish':
        this.finishQuiz();
        break;
      case 'close':
        this.closeQuiz();
        break;
      default:
        if (stepConfig.actions?.[action]) {
          stepConfig.actions[action](this, btn);
        }
    }
  }

  /**
   * Move to next step (with adaptive flow support)
   */
  nextStep() {
    if (!this.activeQuiz) return;
    
    const state = this.activeQuiz.state;
    const definition = this.activeQuiz.definition;
    const currentStepId = state.getCurrentStep().id;
    const currentAnswers = state.getAnswers();
    
    // Check for adaptive next step
    if (this.flowEngine) {
      const adaptiveNext = this.flowEngine.getNextStep(currentStepId, currentAnswers[currentStepId], state);
      
      if (adaptiveNext.stepId) {
        const targetIndex = definition.steps.findIndex(s => s.id === adaptiveNext.stepId);
        if (targetIndex >= 0) {
          state.goToStep(targetIndex);
          this.renderCurrentStep();
          return;
        }
      }
    }

    // Default sequential navigation
    state.nextStep();
    
    // Check completion
    if (state.getStepInfo().isLast) {
      this.handleQuizComplete();
    } else {
      this.renderCurrentStep();
    }
  }

  /**
   * Move to previous step
   */
  prevStep() {
    if (!this.activeQuiz) return;
    
    this.activeQuiz.state.prevStep();
    this.renderCurrentStep();
  }

  /**
   * Handle quiz completion
   */
  handleQuizComplete() {
    if (!this.activeQuiz) return;

    const state = this.activeQuiz.state;
    const definition = this.activeQuiz.definition;
    
    // Complete state
    state.complete();

    // Calculate results using core scoring
    const results = ScoreCalculator.calculate(state.getAnswers(), definition);
    
    // Emit completion event
    this.emitter.emit(QuizEventTypes.QUIZ_COMPLETE, {
      quizId: this.activeQuiz.id,
      results,
      xp: definition.xpReward || 0,
      timestamp: Date.now()
    });

    // Clean up session
    SessionManager.removeSession(this.activeQuiz.id);

    // Render results
    const resultRenderer = StepRenderers.get('results');
    const resultConfig = {
      definition,
      results,
      state: state.getState()
    };
    
    const resultContent = resultRenderer(this, resultConfig, state.getState());
    
    this.modal.open(resultContent, (container) => {
      container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
        this.closeQuiz();
      });
    });
  }

  /**
   * Award XP to user
   */
  awardXP(amount) {
    if (!this.options.xpEnabled || amount <= 0) return;
    
    const currentXP = parseInt(localStorage.getItem('ycc_xp')) || 0;
    const newXP = currentXP + amount;
    localStorage.setItem('ycc_xp', newXP);
    
    AnalyticsManager.track('xp_earned', { amount, total: newXP });
    
    // Update UI if present
    const xpCounter = document.getElementById('xpCounter');
    if (xpCounter) xpCounter.textContent = newXP;
  }

  /**
   * Save current session for recovery
   */
  saveSession() {
    if (!this.activeQuiz || !this.options.saveProgress) return;
    
    SessionManager.saveSession(
      this.activeQuiz.id,
      JSON.parse(this.activeQuiz.state.serialize()),
      this.activeQuiz.definition
    );
  }

  /**
   * Show safety screen
   */
  showSafetyScreen() {
    const safetyContent = this.safetyInterceptor.renderSafetyScreen();
    this.modal.open(safetyContent, (container) => {
      container.querySelector('[data-action="close"]')?.addEventListener('click', () => {
        this.closeQuiz();
      });
    });
  }

  /**
   * Handle safety alert
   */
  handleSafetyAlert(data) {
    AnalyticsManager.track('safety_alert', data);
  }

  /**
   * Show validation errors
   */
  showValidationError(errors) {
    const errorContainer = document.querySelector('.quiz-validation-errors');
    if (errorContainer) {
      errorContainer.innerHTML = errors.map(e => `<p class="error">${e.message}</p>`).join('');
      errorContainer.style.display = 'block';
    }
  }

  /**
   * Close the active quiz
   */
  closeQuiz() {
    // Save session before closing
    this.saveSession();
    
    this.modal.close();
    
    // Emit abort event
    if (this.activeQuiz) {
      this.emitter.emit(QuizEventTypes.QUIZ_ABORT, {
        quizId: this.activeQuiz.id,
        progress: this.activeQuiz.state.getProgress()
      });
    }
    
    this.activeQuiz = null;
  }

  /**
   * Finish quiz early
   */
  finishQuiz() {
    this.handleQuizComplete();
  }

  /**
   * Get quiz list for display
   */
  getQuizList() {
    return QuizRegistry.listAll();
  }

  /**
   * Get progress for specific quiz
   */
  getProgress(quizId) {
    return ProgressManager.get(quizId);
  }

  /**
   * Check for incomplete sessions
   */
  getIncompleteSessions() {
    return SessionManager.getIncompleteSessions();
  }

  /**
   * Resume incomplete session
   */
  resumeSession(quizId) {
    const session = SessionManager.getSession(quizId);
    if (session) {
      this.launchQuiz(quizId);
    }
  }

  /**
   * Subscribe to events
   */
  on(event, callback) {
    this.emitter.on(event, callback);
    return this;
  }

  /**
   * Unsubscribe from events
   */
  off(event, callback) {
    this.emitter.off(event, callback);
    return this;
  }
}

/**
 * QuizModal - Reusable modal component
 */
class QuizModal {
  constructor(overlayId) {
    this.overlayId = overlayId;
    this.overlay = null;
  }

  open(content, onMount) {
    this.ensureOverlay();
    this.overlay.innerHTML = `
      <div class="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="quiz-modal-title">
        <button class="quiz-close-btn" aria-label="Close quiz" data-action="close">&times;</button>
        <div id="quiz-modal-content" class="quiz-modal-content">
          ${content}
        </div>
        <div class="quiz-disclaimer">
          YouthCare Connect provides educational wellness support and does not replace emergency or professional medical care.
        </div>
      </div>
    `;

    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    setTimeout(() => {
      const container = document.getElementById('quiz-modal-content');
      if (onMount) onMount(container);
      
      this.overlay.querySelector('[data-action="close"]')?.addEventListener('click', () => this.close());
    }, 10);
  }

  ensureOverlay() {
    this.overlay = document.getElementById(this.overlayId);
    
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = this.overlayId;
      this.overlay.className = 'quiz-overlay';
      document.body.appendChild(this.overlay);
    }
  }

  close() {
    if (this.overlay) {
      this.overlay.classList.remove('active');
      document.body.style.overflow = '';
      
      setTimeout(() => {
        this.overlay.innerHTML = '';
      }, 300);
    }
  }
}

/**
 * SafetyInterceptor - Detect and handle safety concerns
 */
class SafetyInterceptor {
  constructor() {
    this.triggerPatterns = [
      { pattern: /suicide/i, severity: 'high' },
      { pattern: /kill myself/i, severity: 'high' },
      { pattern: /harm myself/i, severity: 'high' },
      { pattern: /end it all/i, severity: 'high' },
      { pattern: /want to die/i, severity: 'high' },
      { pattern: /better off dead/i, severity: 'high' },
      { pattern: /hurt myself/i, severity: 'high' }
    ];
    
    this.emergencyContacts = {
      emergency: '112',
      crisis: '+250 791 844 573',
      organization: 'YouthCare Connect Support'
    };
  }

  /**
   * Check answer for safety concerns
   */
  checkAnswer(answers) {
    const answerString = JSON.stringify(answers).toLowerCase();
    
    for (const { pattern, severity } of this.triggerPatterns) {
      if (pattern.test(answerString)) {
        return {
          hasConcern: true,
          severity,
          detected: pattern.source,
          timestamp: Date.now()
        };
      }
    }
    
    return { hasConcern: false };
  }

  /**
   * Render safety screen
   */
  renderSafetyScreen() {
    return `
      <div class="safe-screen text-center">
        <div class="safe-icon">🛡️</div>
        <h2 id="quiz-modal-title">You are not alone.</h2>
        <p>It sounds like you might be going through a difficult time. Your safety matters.</p>
        <div class="safe-card">
          <p><strong>YouthCare Connect is an educational platform and cannot provide emergency support.</strong></p>
          <p>Please reach out to someone who can help keep you safe:</p>
          <ul class="safe-list">
            <li>📞 Emergency: <strong>${this.emergencyContacts.emergency}</strong></li>
            <li>💬 Crisis Hotline: <strong>${this.emergencyContacts.crisis}</strong></li>
            <li>🧑‍⚕️ Talk to a trusted teacher, counselor, or family member.</li>
          </ul>
        </div>
        <button class="btn-play mt-4" data-action="close">I understand, take me back</button>
      </div>
    `;
  }
}

/**
 * Initialize engine and expose to window
 */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure core modules are loaded first
  if (typeof QuizState === 'undefined') {
    console.error('Core modules not loaded. Please include src/core/index.js before src/services/QuizEngine.js');
    return;
  }
  
  window.quizEngine = new QuizEngine({
    xpEnabled: true,
    saveProgress: true,
    analyticsEnabled: true
  });
});

window.QuizEngine = QuizEngine;
window.QuizModal = QuizModal;
window.SafetyInterceptor = SafetyInterceptor;