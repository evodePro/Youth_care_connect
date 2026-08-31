/**
 * YouthCare Connect - Quiz System Bundle
 * Production bundle that loads all quiz modules
 * 
 * Load order:
 * 1. Core services (QuizEngine)
 * 2. Registry system
 * 3. Quiz definitions
 * 4. Step renderers
 * 5. Initialization & launch API
 */

// This file should be included AFTER all other JS files
// It's the main entry point that makes everything work together

(function() {
  'use strict';

  /**
   * Wait for all dependencies to be ready
   */
  function whenReady(callback) {
    if (window.QuizEngine && window.QuizRegistry && window.StepRenderers) {
      callback();
    } else {
      setTimeout(() => whenReady(callback), 50);
    }
  }

  whenReady(() => {
    console.log('✅ YouthCare Connect Quiz System Ready');
    
    // Dispatch event for other scripts to know system is ready
    window.dispatchEvent(new CustomEvent('ycc-quiz-ready', {
      detail: { version: '2.0.0', type: 'modular' }
    }));
  });

})();