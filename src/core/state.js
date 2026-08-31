/**
 * YouthCare Connect - Core State Management
 * Immutable state management for quiz instances
 * 
 * Design Principles:
 * - Immutable state updates
 * - Isolated state per quiz instance
 * - State history for undo/redo capability
 * - Built-in validation
 */

const QuizState = (() => {
  /**
   * Create a new quiz state instance
   * @param {Object} definition - Quiz definition
   * @param {Object} options - State options
   * @returns {QuizStateInstance}
   */
  function create(definition, options = {}) {
    const state = {
      quizId: definition.id,
      currentStep: 0,
      answers: {},
      score: null,
      timeSpent: 0,
      startedAt: Date.now(),
      completedAt: null,
      history: [],
      metadata: {
        version: '1.0',
        lastUpdated: Date.now()
      }
    };

    const instance = {
      /**
       * Get current state snapshot (immutable)
       */
      getState: () => Object.freeze({ ...state }),

      /**
       * Get specific state value
       */
      get: (key) => state[key],

      /**
       * Update state with new values
       * @param {Object} updates - State updates
       * @returns {QuizStateInstance} - Returns self for chaining
       */
      set: (updates) => {
        Object.assign(state, updates, { 
          metadata: { ...state.metadata, lastUpdated: Date.now() }
        });
        return instance;
      },

      /**
       * Record answer for current or specific step
       * @param {string} stepId - Step identifier
       * @param {*} answer - Answer value
       */
      recordAnswer: (stepId, answer) => {
        const previousAnswer = state.answers[stepId];
        state.answers[stepId] = answer;
        state.history.push({
          type: 'answer',
          stepId,
          answer,
          previousAnswer,
          timestamp: Date.now()
        });
        return instance;
      },

      /**
       * Get answers for a specific step
       */
      getAnswer: (stepId) => state.answers[stepId],

      /**
       * Get all answers
       */
      getAnswers: () => ({ ...state.answers }),

      /**
       * Move to next step
       */
      nextStep: () => {
        const maxStep = definition.steps.length - 1;
        if (state.currentStep < maxStep) {
          state.currentStep++;
          state.history.push({
            type: 'navigation',
            action: 'next',
            from: state.currentStep - 1,
            to: state.currentStep,
            timestamp: Date.now()
          });
        }
        return instance;
      },

      /**
       * Move to previous step
       */
      prevStep: () => {
        if (state.currentStep > 0) {
          state.currentStep--;
          state.history.push({
            type: 'navigation',
            action: 'prev',
            from: state.currentStep + 1,
            to: state.currentStep,
            timestamp: Date.now()
          });
        }
        return instance;
      },

      /**
       * Jump to specific step
       */
      goToStep: (stepIndex) => {
        if (stepIndex >= 0 && stepIndex < definition.steps.length) {
          state.currentStep = stepIndex;
        }
        return instance;
      },

      /**
       * Get current step definition
       */
      getCurrentStep: () => definition.steps[state.currentStep],

      /**
       * Check if quiz is complete
       */
      isComplete: () => state.completedAt !== null,

      /**
       * Mark quiz as complete
       */
      complete: (results = {}) => {
        state.completedAt = Date.now();
        state.timeSpent = state.completedAt - state.startedAt;
        state.score = results.score;
        state.results = results;
        return instance;
      },

      /**
       * Calculate progress percentage
       */
      getProgress: () => {
        const totalSteps = definition.steps.length;
        return totalSteps > 0 ? Math.round((state.currentStep / totalSteps) * 100) : 0;
      },

      /**
       * Get step count info
       */
      getStepInfo: () => ({
        current: state.currentStep + 1,
        total: definition.steps.length,
        isFirst: state.currentStep === 0,
        isLast: state.currentStep === definition.steps.length - 1
      }),

      /**
       * Validate current step has required answer
       */
      validateCurrentStep: () => {
        const step = definition.steps[state.currentStep];
        if (!step) return { valid: false, error: 'Step not found' };

        const answer = state.answers[step.id];
        const required = step.required !== false;

        if (required && (answer === undefined || answer === null || answer === '')) {
          return { valid: false, error: 'Answer required', stepId: step.id };
        }

        return { valid: true };
      },

      /**
       * Serialize state for persistence
       */
      serialize: () => JSON.stringify(state),

      /**
       * Restore state from serialized data
       */
      restore: (serialized) => {
        try {
          const restored = JSON.parse(serialized);
          Object.assign(state, restored, {
            metadata: { ...state.metadata, lastUpdated: Date.now(), restored: true }
          });
          return instance;
        } catch (e) {
          console.error('Failed to restore state:', e);
          return instance;
        }
      }
    };

    return instance;
  }

  return { create };
})();

/**
 * State Factory - Creates and manages multiple state instances
 */
const StateFactory = (() => {
  const instances = new Map();

  return {
    /**
     * Create a new state instance
     */
    create: (quizId, definition, options = {}) => {
      const state = QuizState.create(definition, options);
      instances.set(quizId, state);
      return state;
    },

    /**
     * Get existing state instance
     */
    get: (quizId) => instances.get(quizId) || null,

    /**
     * Remove state instance
     */
    remove: (quizId) => instances.delete(quizId),

    /**
     * Clear all instances
     */
    clear: () => instances.clear(),

    /**
     * Get all active instances
     */
    getAll: () => instances
  };
})();

window.QuizState = QuizState;
window.StateFactory = StateFactory;