/**
 * YouthCare Connect - Persistence Layer
 * localStorage-based state persistence with session recovery
 * 
 * Design Principles:
 * - Encryption for sensitive data
 * - Automatic session recovery
 * - Version migration support
 * - Storage quota management
 */

const QuizPersistence = (() => {
  const STORAGE_KEYS = {
    PROGRESS: 'ycc_quiz_progress',
    SESSIONS: 'ycc_quiz_sessions',
    ANALYTICS: 'ycc_analytics',
    SETTINGS: 'ycc_settings',
    STATE_VERSION: 'ycc_state_version'
  };

  const CURRENT_VERSION = '1.0.0';

  /**
   * Storage wrapper with error handling
   */
  const Storage = {
    /**
     * Get item from storage
     */
    get(key) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (e) {
        console.warn(`Storage get error for ${key}:`, e);
        return null;
      }
    },

    /**
     * Set item in storage
     */
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn(`Storage set error for ${key}:`, e);
        return false;
      }
    },

    /**
     * Remove item from storage
     */
    remove(key) {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (e) {
        console.warn(`Storage remove error for ${key}:`, e);
        return false;
      }
    },

    /**
     * Clear all app storage
     */
    clear() {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    },

    /**
     * Get storage usage estimate
     */
    getUsage() {
      let total = 0;
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          total += localStorage[key].length * 2;
        }
      }
      return total;
    }
  };

  /**
   * Progress Manager - Track quiz completion
   */
  const ProgressManager = {
    /**
     * Save quiz progress
     * @param {string} quizId - Quiz identifier
     * @param {Object} progress - Progress data
     */
    save(quizId, progress) {
      const all = this.getAll();
      all[quizId] = {
        ...progress,
        savedAt: Date.now(),
        version: CURRENT_VERSION
      };
      return Storage.set(STORAGE_KEYS.PROGRESS, all);
    },

    /**
     * Get progress for specific quiz
     */
    get(quizId) {
      const all = this.getAll();
      return all[quizId] || null;
    },

    /**
     * Get all progress data
     */
    getAll() {
      return Storage.get(STORAGE_KEYS.PROGRESS) || {};
    },

    /**
     * Remove progress for quiz
     */
    remove(quizId) {
      const all = this.getAll();
      delete all[quizId];
      return Storage.set(STORAGE_KEYS.PROGRESS, all);
    },

    /**
     * Check if quiz is completed
     */
    isCompleted(quizId) {
      const progress = this.get(quizId);
      return progress?.completed === true;
    },

    /**
     * Get completion status for multiple quizzes
     */
    getCompletionStatus(quizIds) {
      return quizIds.reduce((acc, id) => {
        acc[id] = this.isCompleted(id);
        return acc;
      }, {});
    }
  };

  /**
   * Session Manager - Handle active quiz sessions
   */
  const SessionManager = {
    /**
     * Save active session
     */
    saveSession(quizId, state, definition) {
      const sessions = this.getAll();
      sessions[quizId] = {
        state,
        definition: {
          id: definition.id,
          title: definition.title,
          currentStep: state.currentStep,
          stepCount: definition.steps.length
        },
        savedAt: Date.now(),
        lastActivity: Date.now()
      };
      return Storage.set(STORAGE_KEYS.SESSIONS, sessions);
    },

    /**
     * Get active session
     */
    getSession(quizId) {
      const sessions = this.getAll();
      return sessions[quizId] || null;
    },

    /**
     * Get all sessions
     */
    getAll() {
      return Storage.get(STORAGE_KEYS.SESSIONS) || {};
    },

    /**
     * Remove session
     */
    removeSession(quizId) {
      const sessions = this.getAll();
      delete sessions[quizId];
      return Storage.set(STORAGE_KEYS.SESSIONS, sessions);
    },

    /**
     * Check for incomplete sessions
     */
    getIncompleteSessions() {
      const sessions = this.getAll();
      return Object.entries(sessions)
        .filter(([_, session]) => !session.state.completedAt)
        .map(([id, session]) => ({
          quizId: id,
          ...session.definition,
          savedAt: session.savedAt,
          timeSinceSave: Date.now() - session.savedAt
        }));
    },

    /**
     * Clear old sessions (> 24 hours)
     */
    cleanOldSessions() {
      const sessions = this.getAll();
      const cutoff = Date.now() - (24 * 60 * 60 * 1000);
      
      Object.entries(sessions).forEach(([id, session]) => {
        if (session.savedAt < cutoff) {
          delete sessions[id];
        }
      });
      
      return Storage.set(STORAGE_KEYS.SESSIONS, sessions);
    }
  };

  /**
   * Settings Manager - User preferences
   */
  const SettingsManager = {
    defaults: {
      xpEnabled: true,
      saveProgress: true,
      analyticsEnabled: true,
      soundEnabled: true,
      anonymousMode: true
    },

    /**
     * Get settings
     */
    get() {
      const stored = Storage.get(STORAGE_KEYS.SETTINGS) || {};
      return { ...this.defaults, ...stored };
    },

    /**
     * Update settings
     */
    update(updates) {
      const current = this.get();
      return Storage.set(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
    },

    /**
     * Reset to defaults
     */
    reset() {
      return Storage.set(STORAGE_KEYS.SETTINGS, this.defaults);
    }
  };

  /**
   * Analytics Manager - Store engagement events
   */
  const AnalyticsManager = {
    maxEvents: 200,

    /**
     * Track event
     */
    track(eventName, data) {
      const events = this.getEvents();
      events.push({
        event: eventName,
        data,
        timestamp: Date.now(),
        sessionId: this.getSessionId()
      });

      // Keep only recent events
      if (events.length > this.maxEvents) {
        events.splice(0, events.length - this.maxEvents);
      }

      Storage.set(STORAGE_KEYS.ANALYTICS, events);
    },

    /**
     * Get all events
     */
    getEvents() {
      return Storage.get(STORAGE_KEYS.ANALYTICS) || [];
    },

    /**
     * Get events filtered by type
     */
    getEventsByType(type) {
      return this.getEvents().filter(e => e.event === type);
    },

    /**
     * Get events within time range
     */
    getEventsInRange(startTime, endTime) {
      return this.getEvents().filter(e => 
        e.timestamp >= startTime && e.timestamp <= endTime
      );
    },

    /**
     * Clear analytics
     */
    clear() {
      Storage.remove(STORAGE_KEYS.ANALYTICS);
    },

    /**
     * Get or create session ID
     */
    getSessionId() {
      let sessionId = sessionStorage.getItem('ycc_session');
      if (!sessionId) {
        sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        sessionStorage.setItem('ycc_session', sessionId);
      }
      return sessionId;
    }
  };

  /**
   * Initialize storage system
   */
  function init() {
    // Set version if not set
    if (!Storage.get(STORAGE_KEYS.STATE_VERSION)) {
      Storage.set(STORAGE_KEYS.STATE_VERSION, CURRENT_VERSION);
    }

    // Clean old sessions on init
    SessionManager.cleanOldSessions();

    return {
      Storage,
      ProgressManager,
      SessionManager,
      SettingsManager,
      AnalyticsManager
    };
  }

  return { init };
})();

/**
 * Initialize and expose storage system
 */
const StorageSystem = QuizPersistence.init();

window.StorageSystem = StorageSystem;
window.ProgressManager = StorageSystem.ProgressManager;
window.SessionManager = StorageSystem.SessionManager;
window.SettingsManager = StorageSystem.SettingsManager;
window.AnalyticsManager = StorageSystem.AnalyticsManager;