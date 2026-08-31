/**
 * YouthCare Connect - Quiz System Initialization
 * Entry point that bootstraps the modular quiz system
 */

(function() {
  'use strict';

  /**
   * QuizLauncher - Public API for launching quizzes
   * This provides a clean interface for HTML to trigger quizzes
   */
  window.QuizLauncher = {
    engine: null,
    initialized: false,

    /**
     * Initialize the quiz system
     */
    init(options = {}) {
      if (this.initialized) return;
      
      this.engine = new QuizEngine({
        containerSelector: '#quiz-modal-content',
        overlayId: 'quiz-engine-overlay',
        xpEnabled: true,
        saveProgress: true,
        analyticsEnabled: true,
        ...options
      });

      this.initialized = true;
      console.log('YouthCare Connect Quiz Engine initialized');
    },

    /**
     * Launch a quiz by ID
     */
    launch(quizId, params = {}) {
      if (!this.initialized) this.init();
      this.engine.launchQuiz(quizId, params);
    },

    /**
     * Get list of available quizzes
     */
    getQuizzes() {
      if (!this.initialized) this.init();
      return this.engine.getQuizList();
    },

    /**
     * Get quiz by ID
     */
    getQuiz(quizId) {
      return QuizRegistry.get(quizId);
    },

    /**
     * Get progress for a specific quiz
     */
    getProgress(quizId) {
      if (!this.initialized) return null;
      return this.engine.getProgress(quizId);
    }
  };

  /**
   * Quick launch helpers for common quizzes
   * These can be called directly from onclick attributes
   */
  window.QuickLaunch = {
    moodCheckIn() {
      QuizLauncher.launch('mood-checkin');
    },
    burnoutCheck() {
      QuizLauncher.launch('burnout-check');
    },
    anxietyCheck() {
      QuizLauncher.launch('anxiety-check');
    },
    stiAwareness() {
      QuizLauncher.launch('sti-awareness');
    },
    consentEducation() {
      QuizLauncher.launch('consent-education');
    },
    mythFact() {
      QuizLauncher.launch('myth-fact');
    },
    relationshipCheck() {
      QuizLauncher.launch('relationship-check');
    },
    onlineSafety() {
      QuizLauncher.launch('online-safety');
    },
    peerPressure() {
      QuizLauncher.launch('peer-pressure');
    },
    stressCheck() {
      QuizLauncher.launch('stress-check');
    }
  };

  /**
   * Auto-initialize when DOM is ready
   */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      QuizLauncher.init();
      window.dispatchEvent(new CustomEvent('quiz-engine-ready'));
    });
  } else {
    QuizLauncher.init();
    window.dispatchEvent(new CustomEvent('quiz-engine-ready'));
  }

})();

/**
 * Legacy support - map old function names to new system
 * This maintains backward compatibility with existing code
 */
(function() {
  const legacyMap = {
    'launchMentalCheckIn': 'mood-checkin',
    'launchBreathing': 'breathing-exercise',
    'launchMythVsFact': 'myth-fact',
    'launchRelationships': 'relationship-check',
    'launchChallenges': 'daily-challenges',
    'launchEQ': 'emotional-intelligence',
    'launchLessons': 'learning-hub'
  };

  window.QuizEngineLegacy = {
    launchMentalCheckIn: () => QuizLauncher.launch('mood-checkin'),
    launchBreathing: () => console.log('Breathing exercise moved to mindfulness section'),
    launchMythVsFact: () => QuizLauncher.launch('myth-fact'),
    launchRelationships: () => QuizLauncher.launch('relationship-check'),
    launchChallenges: () => console.log('Challenges moved to daily wellness'),
    launchEQ: () => QuizLauncher.launch('emotional-intelligence'),
    launchLessons: () => console.log('Learning hub redesigned')
  };

})();