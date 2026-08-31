/**
 * YouthCare Connect — Cycle Tracker State Management
 * Client-side state manager mirroring core/state.js pattern.
 */

const CycleState = (() => {
  'use strict';

  const ANON_ID_KEY = 'youthcare_cycle_anon_id';
  const DEFAULTS_KEY = 'youthcare_cycle_setup';

  const state = {
    anonId: null,
    logs: [], // Array of { month_index, period_start_date, period_end_date }
    setup: { isRegular: true, lastPeriodStart: null, cycleLength: 28, periodLength: 5 },
    profile: {
      avg_cycle_length: null,
      avg_period_length: null,
      history_complete: false,
      last_period_start_date: null,
      next_period_predicted: null,
      ovulation_predicted: null,
      fertile_window_start: null,
      fertile_window_end: null
    },
    isLoaded: false
  };

  const listeners = [];

  function notifyListeners() {
    listeners.forEach(fn => fn(getState()));
  }

  function subscribe(fn) {
    listeners.push(fn);
    return () => {
      const idx = listeners.indexOf(fn);
      if (idx > -1) listeners.splice(idx, 1);
    };
  }

  function getState() {
    return JSON.parse(JSON.stringify(state)); // Return immutable copy
  }

  function initAnonId() {
    let id = localStorage.getItem(ANON_ID_KEY);
    if (!id) {
      id = 'cycle-' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
      localStorage.setItem(ANON_ID_KEY, id);
    }
    state.anonId = id;
    return id;
  }

  function loadManualDefaults() {
    const saved = localStorage.getItem(DEFAULTS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.cycleLength) {
          state.setup = { ...state.setup, ...parsed };
        }
      } catch (e) {
        console.error("Failed to parse setup", e);
      }
    }
  }

  function saveSetup(setupData) {
    state.setup = { ...state.setup, ...setupData };
    localStorage.setItem(DEFAULTS_KEY, JSON.stringify(state.setup));
    notifyListeners();
  }

  function setLogs(logs) {
    state.logs = logs || [];
    notifyListeners();
  }

  function addOrUpdateLog(logEntry) {
    const idx = state.logs.findIndex(l => l.month_index === logEntry.month_index);
    if (idx > -1) {
      state.logs[idx] = logEntry;
    } else {
      state.logs.push(logEntry);
    }
    state.logs.sort((a, b) => a.month_index - b.month_index);
    notifyListeners();
  }

  function setProfile(profileData) {
    if (profileData) {
      state.profile = { ...state.profile, ...profileData };
    } else {
      // Reset
      state.profile = {
        avg_cycle_length: null,
        avg_period_length: null,
        history_complete: false,
        last_period_start_date: null,
        next_period_predicted: null,
        ovulation_predicted: null,
        fertile_window_start: null,
        fertile_window_end: null
      };
    }
    notifyListeners();
  }

  function setLoaded(loaded) {
    state.isLoaded = loaded;
    notifyListeners();
  }

  function clearState() {
    localStorage.removeItem(ANON_ID_KEY);
    localStorage.removeItem(DEFAULTS_KEY);
    state.anonId = null;
    state.logs = [];
    state.setup = { isRegular: true, lastPeriodStart: null, cycleLength: 28, periodLength: 5 };
    state.profile = {
        avg_cycle_length: null,
        avg_period_length: null,
        history_complete: false,
        last_period_start_date: null,
        next_period_predicted: null,
        ovulation_predicted: null,
        fertile_window_start: null,
        fertile_window_end: null
    };
    initAnonId(); // Generate new ID
    notifyListeners();
  }

  return {
    subscribe,
    getState,
    initAnonId,
    loadManualDefaults,
    saveSetup,
    setLogs,
    addOrUpdateLog,
    setProfile,
    setLoaded,
    clearState
  };

})();

if (typeof window !== 'undefined') {
  window.CycleState = CycleState;
}
