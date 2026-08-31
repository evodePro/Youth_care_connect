/**
 * YouthCare Connect — Cycle Tracker Orchestrator
 * Wires together State, Calculator, Supabase Client, and Renderer.
 */

const CycleTracker = (() => {
  'use strict';

  let anonId = null;

  async function init() {
    try {
      // 1. Initialize State and Anon ID
      anonId = CycleState.initAnonId();
      CycleState.loadManualDefaults();
      
      // 2. Fetch existing data from Supabase
      const logs = await CycleSupabase.fetchCycleLogs(anonId);
      CycleState.setLogs(logs);

      const profile = await CycleSupabase.fetchCycleProfile(anonId);
      CycleState.setProfile(profile);
      
      CycleState.setLoaded(true);
      
      // 3. Recalculate if needed
      await recalculate();

    } catch (error) {
      console.error("Failed to initialize Cycle Tracker:", error);
      // Even if offline, we can show the UI loaded
      CycleState.setLoaded(true);
    }
  }

  async function logMonth(monthIndex, startDate, endDate) {
    try {
      // 1. Validate input
      const validation = CycleCalculator.validateMonthInput(startDate, endDate);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      // 2. Update Supabase
      await CycleSupabase.upsertCycleLog(anonId, monthIndex, startDate, endDate);

      // 3. Update Local State
      CycleState.addOrUpdateLog({
        anon_id: anonId,
        month_index: monthIndex,
        period_start_date: startDate,
        period_end_date: endDate
      });

      // 4. Recalculate predictions and profile
      await recalculate();

      return { success: true, warnings: validation.warnings };
    } catch (error) {
      console.error("Failed to log month:", error);
      return { success: false, errors: ["An error occurred while saving your log."] };
    }
  }

  async function updateSetup(setupData) {
    CycleState.saveSetup(setupData);
    await recalculate();
  }

  async function recalculate() {
    const state = CycleState.getState();
    const logs = state.logs;
    
    let historyComplete = false;
    let avgCycleLength = state.setup.cycleLength || 28;
    let avgPeriodLength = state.setup.periodLength || 5;
    let lastPeriodStart = state.setup.lastPeriodStart;

    if (logs.length > 0) {
      // Use the most recent logged start date if they have logged
      lastPeriodStart = logs[logs.length - 1].period_start_date;
    }

    if (logs.length === CycleCalculator.CONSTANTS.REQUIRED_MONTHS) {
      // Check chronological validity before using real averages
      const orderCheck = CycleCalculator.validateChronologicalOrder(logs);
      if (orderCheck.valid) {
        historyComplete = true;
        const calcCycleLen = CycleCalculator.calculateAvgCycleLength(logs);
        const calcPeriodLen = CycleCalculator.calculateAvgPeriodLength(logs);
        
        if (calcCycleLen !== null) avgCycleLength = calcCycleLen;
        if (calcPeriodLen !== null) avgPeriodLength = calcPeriodLen;
      }
    }

    let predictions = null;
    let nextPeriodPredicted = null;
    let ovulationPredicted = null;
    let fertileWindowStart = null;
    let fertileWindowEnd = null;

    if (lastPeriodStart) {
      // Even if irregular, we calculate based on a 28 day average to get the fertile window
      let calcCycleLength = historyComplete ? avgCycleLength : (state.setup.isRegular ? state.setup.cycleLength : 28);
      predictions = CycleCalculator.computeAllPredictions(lastPeriodStart, calcCycleLength, avgPeriodLength);
      
      fertileWindowStart = CycleCalculator.formatDate(predictions.fertileWindowStart);
      fertileWindowEnd = CycleCalculator.formatDate(predictions.fertileWindowEnd);
      ovulationPredicted = CycleCalculator.formatDate(predictions.ovulationDate);

      // If irregular and history is not complete, we hide the next period prediction
      if (historyComplete || state.setup.isRegular) {
        nextPeriodPredicted = CycleCalculator.formatDate(predictions.nextPeriodStart);
      }
    }

    const newProfile = {
      avg_cycle_length: avgCycleLength,
      avg_period_length: avgPeriodLength,
      history_complete: historyComplete,
      last_period_start_date: lastPeriodStart,
      next_period_predicted: nextPeriodPredicted,
      ovulation_predicted: ovulationPredicted,
      fertile_window_start: fertileWindowStart,
      fertile_window_end: fertileWindowEnd
    };

    // Update Local State
    CycleState.setProfile(newProfile);

    // Update Supabase
    try {
      await CycleSupabase.upsertCycleProfile(anonId, newProfile);
    } catch (err) {
      console.error("Failed to upsert cycle profile to Supabase. Offline mode?", err);
    }
  }

  async function clearAllData() {
    try {
      await CycleSupabase.deleteAllCycleData(anonId);
      CycleState.clearState();
      anonId = CycleState.getState().anonId; // get the newly generated one
    } catch (error) {
      console.error("Failed to clear cycle data:", error);
      throw error;
    }
  }

  return {
    init,
    logMonth,
    updateSetup,
    recalculate,
    clearAllData
  };

})();

if (typeof window !== 'undefined') {
  window.CycleTracker = CycleTracker;
}
