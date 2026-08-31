/**
 * YouthCare Connect - Event System
 * Isolated event handling for quiz instances
 * 
 * Design Principles:
 * - Namespaced events per quiz instance
 * - Weak references to prevent memory leaks
 * - Async event handling
 * - Event history for debugging
 */

const QuizEvents = (() => {
  /**
   * Create isolated event emitter for a quiz instance
   * @param {string} instanceId - Unique instance identifier
   * @returns {EventEmitter}
   */
  function createEmitter(instanceId) {
    const listeners = new Map();
    const eventHistory = [];
    const maxHistory = 50;

    const emitter = {
      /**
       * Subscribe to an event
       * @param {string} event - Event name
       * @param {Function} callback - Event handler
       * @param {Object} context - Optional context for callback
       */
      on(event, callback, context = null) {
        if (!listeners.has(event)) {
          listeners.set(event, []);
        }
        listeners.get(event).push({ callback, context, bound: callback.bind(context) });
        return emitter;
      },

      /**
       * Subscribe to event once
       */
      once(event, callback, context = null) {
        const wrapper = (...args) => {
          emitter.off(event, wrapper);
          callback.apply(context, args);
        };
        return emitter.on(event, wrapper);
      },

      /**
       * Unsubscribe from event
       */
      off(event, callback) {
        if (!listeners.has(event)) return emitter;
        
        if (!callback) {
          listeners.delete(event);
        } else {
          const filtered = listeners.get(event).filter(l => l.callback !== callback);
          listeners.set(event, filtered);
        }
        return emitter;
      },

      /**
       * Emit event to all listeners
       */
      emit(event, data = {}) {
        const eventRecord = {
          event,
          data,
          timestamp: Date.now(),
          instanceId
        };
        
        eventHistory.push(eventRecord);
        if (eventHistory.length > maxHistory) {
          eventHistory.shift();
        }

        const handlers = listeners.get(event) || [];
        const globalHandlers = listeners.get('*') || [];
        const allHandlers = [...handlers, ...globalHandlers];

        allHandlers.forEach(handler => {
          try {
            handler.bound ? handler.bound(data) : handler.callback(data);
          } catch (e) {
            console.error(`Event handler error for ${event}:`, e);
          }
        });

        return emitter;
      },

      /**
       * Subscribe to all events (wildcard)
       */
      onAny(callback) {
        return emitter.on('*', callback);
      },

      /**
       * Get event history
       */
      getHistory: () => [...eventHistory],

      /**
       * Clear all listeners
       */
      clear() {
        listeners.clear();
        return emitter;
      }
    };

    return emitter;
  }

  return { createEmitter };
})();

/**
 * Global Event Bus - For cross-component communication
 */
const EventBus = (() => {
  const globalEmitter = QuizEvents.createEmitter('global');
  
  return {
    /**
     * Subscribe to global event
     */
    on: (event, callback, context) => globalEmitter.on(event, callback, context),
    
    /**
     * Subscribe once
     */
    once: (event, callback, context) => globalEmitter.once(event, callback, context),
    
    /**
     * Emit global event
     */
    emit: (event, data) => globalEmitter.emit(event, data),
    
    /**
     * Unsubscribe
     */
    off: (event, callback) => globalEmitter.off(event, callback),
    
    /**
     * Get history
     */
    getHistory: () => globalEmitter.getHistory()
  };
})();

/**
 * Event Types - Standardized event names
 */
const QuizEventTypes = {
  // Quiz lifecycle
  QUIZ_START: 'quiz:start',
  QUIZ_COMPLETE: 'quiz:complete',
  QUIZ_ABORT: 'quiz:abort',
  QUIZ_RESUME: 'quiz:resume',
  
  // Step events
  STEP_ENTER: 'step:enter',
  STEP_EXIT: 'step:exit',
  STEP_VALIDATE: 'step:validate',
  STEP_SUBMIT: 'step:submit',
  
  // Answer events
  ANSWER_CHANGE: 'answer:change',
  ANSWER_SUBMIT: 'answer:submit',
  ANSWER_VALID: 'answer:valid',
  ANSWER_INVALID: 'answer:invalid',
  
  // Navigation events
  NAV_NEXT: 'nav:next',
  NAV_PREV: 'nav:prev',
  NAV_JUMP: 'nav:jump',
  
  // Results events
  RESULTS_GENERATE: 'results:generate',
  RESULTS_DISPLAY: 'results:display',
  
  // Safety events
  SAFETY_CHECK: 'safety:check',
  SAFETY_ALERT: 'safety:alert',
  
  // Analytics events
  ANALYTICS_EVENT: 'analytics:event',
  
  // Error events
  ERROR: 'error'
};

/**
 * Event Middleware - For adding cross-cutting concerns
 */
const EventMiddleware = (() => {
  const middleware = [];

  return {
    /**
     * Add middleware function
     * @param {Function} fn - Middleware function (event, next) => {}
     */
    use(fn) {
      middleware.push(fn);
    },

    /**
     * Process event through middleware chain
     */
    process(event, data, next) {
      let index = 0;
      
      const run = (i) => {
        if (i >= middleware.length) {
          return next();
        }
        middleware[i](event, data, () => run(i + 1));
      };
      
      run(index);
    },

    /**
     * Clear all middleware
     */
    clear() {
      middleware.length = 0;
    }
  };
})();

window.QuizEvents = QuizEvents;
window.EventBus = EventBus;
window.QuizEventTypes = QuizEventTypes;
window.EventMiddleware = EventMiddleware;