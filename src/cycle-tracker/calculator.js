/**
 * YouthCare Connect — Cycle Tracker Calculator
 * Pure prediction & averaging functions. No DOM, no Supabase, no localStorage.
 * 
 * Evidence-based constants sourced from:
 * - WHO: Normal adult cycle 21–35 days; adolescent cycle 21–45 days
 * - FIGO (2024): Normal cycle frequency 24–38 days; menses duration ≤8 days;
 *   cycle-to-cycle variation ≤7–9 days
 * - RBC / Rwanda MoH: Aligned with WHO/FIGO standards
 * - Standard Days Method (SDM): Fertile window days 8–19 for cycles 26–32 days
 * - Luteal phase: Average 14 days (normal range 11–17 days per ASRM)
 * 
 * Rwanda policy context:
 * - Law n° 026/2025: Adolescents aged 15+ can access SRH services independently
 */

const CycleCalculator = (() => {
  'use strict';

  // =============================================
  // EVIDENCE-BASED CONSTANTS
  // =============================================
  const CONSTANTS = Object.freeze({
    // WHO/FIGO normal cycle frequency range (adults)
    MIN_CYCLE_LENGTH: 21,
    MAX_CYCLE_LENGTH: 45,       // Extended for adolescents (WHO)
    FIGO_MIN_CYCLE: 24,         // FIGO strict normal lower bound
    FIGO_MAX_CYCLE: 38,         // FIGO strict normal upper bound

    // Period duration limits (FIGO: ≤8 days is normal)
    MIN_PERIOD_LENGTH: 1,
    MAX_PERIOD_LENGTH: 8,       // FIGO upper bound for normal menses duration
    WARN_PERIOD_LENGTH: 9,      // Flag for clinical review if >8 days

    // Luteal phase (ASRM / evidence-based)
    LUTEAL_PHASE_DAYS: 14,      // Average; normal range 11–17 days
    LUTEAL_PHASE_MIN: 11,
    LUTEAL_PHASE_MAX: 17,

    // Fertile window (based on sperm viability ~5 days + egg ~1 day)
    FERTILE_DAYS_BEFORE_OVULATION: 5,
    FERTILE_DAYS_AFTER_OVULATION: 1,

    // Gap sanity check range (for consecutive month logging)
    GAP_MIN_DAYS: 21,           // WHO adolescent minimum
    GAP_MAX_DAYS: 45,           // WHO adolescent maximum

    // Defaults for users without history
    DEFAULT_CYCLE_LENGTH: 28,
    DEFAULT_PERIOD_LENGTH: 5,

    // Required months for complete history
    REQUIRED_MONTHS: 6
  });

  // =============================================
  // DATE UTILITIES
  // =============================================

  /**
   * Parse a date string (YYYY-MM-DD) or Date object into a clean Date at midnight UTC.
   */
  function toDate(d) {
    if (d instanceof Date) return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const parts = String(d).split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }

  /**
   * Calculate difference in days between two dates.
   */
  function daysBetween(a, b) {
    const dateA = toDate(a);
    const dateB = toDate(b);
    const ms = dateB.getTime() - dateA.getTime();
    return Math.round(ms / (1000 * 60 * 60 * 24));
  }

  /**
   * Add days to a date and return a new Date.
   */
  function addDays(date, days) {
    const d = toDate(date);
    d.setDate(d.getDate() + days);
    return d;
  }

  /**
   * Format a Date as YYYY-MM-DD string.
   */
  function formatDate(date) {
    const d = toDate(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // =============================================
  // CORE CALCULATION FUNCTIONS
  // =============================================

  /**
   * Calculate average cycle length from sorted logs.
   * Uses the 5 consecutive gaps between month[i+1].start and month[i].start.
   * 
   * @param {Array} logs - Array of {period_start_date, period_end_date}, sorted by month_index
   * @returns {number|null} Average cycle length in days, or null if insufficient data
   */
  function calculateAvgCycleLength(logs) {
    if (!logs || logs.length < 2) return null;

    const gaps = [];
    for (let i = 0; i < logs.length - 1; i++) {
      const gap = daysBetween(logs[i].period_start_date, logs[i + 1].period_start_date);
      if (gap > 0) gaps.push(gap);
    }

    if (gaps.length === 0) return null;
    const sum = gaps.reduce((a, b) => a + b, 0);
    return Math.round((sum / gaps.length) * 10) / 10;
  }

  /**
   * Calculate average period length from logs.
   * Period length = end_date - start_date + 1 (inclusive count of days).
   * 
   * @param {Array} logs - Array of {period_start_date, period_end_date}
   * @returns {number|null} Average period length in days, or null if no data
   */
  function calculateAvgPeriodLength(logs) {
    if (!logs || logs.length === 0) return null;

    const lengths = logs.map(log => {
      return daysBetween(log.period_start_date, log.period_end_date) + 1;
    });

    const sum = lengths.reduce((a, b) => a + b, 0);
    return Math.round((sum / lengths.length) * 10) / 10;
  }

  /**
   * Predict the next period start date.
   * nextPeriodStart = lastPeriodStartDate + avgCycleLength days
   * 
   * @param {Date|string} lastPeriodStart - The last known period start date
   * @param {number} avgCycleLength - Average cycle length in days
   * @returns {Date} Predicted next period start date
   */
  function predictNextPeriod(lastPeriodStart, avgCycleLength) {
    return addDays(lastPeriodStart, Math.round(avgCycleLength));
  }

  /**
   * Predict ovulation date.
   * Calculated BACKWARD from the next predicted period start.
   * ovulationDate = nextPeriodStart - 14 days (luteal phase)
   * 
   * This is more accurate than counting forward from day 14 because
   * the luteal phase length (avg 14 days, range 11-17) is more consistent
   * than the follicular phase which varies with cycle length.
   * 
   * @param {Date|string} nextPeriodStart - Predicted next period start date
   * @returns {Date} Predicted ovulation date
   */
  function predictOvulation(nextPeriodStart) {
    return addDays(nextPeriodStart, -CONSTANTS.LUTEAL_PHASE_DAYS);
  }

  /**
   * Predict the fertile window around ovulation.
   * Fertile window: ovulation - 5 days to ovulation + 1 day
   * 
   * Based on:
   * - Sperm can survive in the reproductive tract up to 5 days
   * - The egg is viable for ~12-24 hours after ovulation
   * 
   * @param {Date|string} ovulationDate - Predicted ovulation date
   * @returns {{start: Date, end: Date}} Fertile window boundaries
   */
  function predictFertileWindow(ovulationDate) {
    return {
      start: addDays(ovulationDate, -CONSTANTS.FERTILE_DAYS_BEFORE_OVULATION),
      end: addDays(ovulationDate, CONSTANTS.FERTILE_DAYS_AFTER_OVULATION)
    };
  }

  /**
   * Run all predictions from a last period start date and cycle parameters.
   * 
   * @param {Date|string} lastPeriodStart
   * @param {number} avgCycleLength
   * @param {number} avgPeriodLength
   * @returns {Object} Full prediction results
   */
  function computeAllPredictions(lastPeriodStart, avgCycleLength, avgPeriodLength) {
    const nextPeriod = predictNextPeriod(lastPeriodStart, avgCycleLength);
    const ovulation = predictOvulation(nextPeriod);
    const fertile = predictFertileWindow(ovulation);
    const periodEnd = addDays(nextPeriod, Math.round(avgPeriodLength) - 1);

    return {
      nextPeriodStart: nextPeriod,
      nextPeriodEnd: periodEnd,
      ovulationDate: ovulation,
      fertileWindowStart: fertile.start,
      fertileWindowEnd: fertile.end,
      // Formatted strings for display
      formatted: {
        nextPeriodStart: formatDate(nextPeriod),
        nextPeriodEnd: formatDate(periodEnd),
        ovulationDate: formatDate(ovulation),
        fertileWindowStart: formatDate(fertile.start),
        fertileWindowEnd: formatDate(fertile.end)
      }
    };
  }

  // =============================================
  // VALIDATION FUNCTIONS
  // =============================================

  /**
   * Validate chronological order of logged months.
   * Each month's start must be after the previous month's end.
   * 
   * @param {Array} logs - Sorted array of {month_index, period_start_date, period_end_date}
   * @returns {{valid: boolean, errors: Array}} Validation result with per-month errors
   */
  function validateChronologicalOrder(logs) {
    const errors = [];
    const sorted = [...logs].sort((a, b) => a.month_index - b.month_index);

    for (let i = 1; i < sorted.length; i++) {
      const prev = sorted[i - 1];
      const curr = sorted[i];
      const prevEnd = toDate(prev.period_end_date);
      const currStart = toDate(curr.period_start_date);

      if (currStart <= prevEnd) {
        errors.push({
          monthIndex: curr.month_index,
          message: `Month ${curr.month_index} starts on or before Month ${prev.month_index} ends. Each period must start after the previous one ended.`
        });
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if the gap between consecutive months is within the typical range.
   * Flags but does NOT block if outside 21–45 days (WHO adolescent range).
   * 
   * @param {Date|string} prevStartDate - Previous month's period start date
   * @param {Date|string} nextStartDate - Next month's period start date
   * @returns {{ok: boolean, gapDays: number, message: string|null}}
   */
  function checkGapSanity(prevStartDate, nextStartDate) {
    const gap = daysBetween(prevStartDate, nextStartDate);
    let message = null;
    let ok = true;

    if (gap < CONSTANTS.GAP_MIN_DAYS) {
      ok = false;
      message = `That's ${gap} days between cycles — a bit shorter than the typical range (${CONSTANTS.GAP_MIN_DAYS}–${CONSTANTS.GAP_MAX_DAYS} days). That's okay, cycles vary.`;
    } else if (gap > CONSTANTS.GAP_MAX_DAYS) {
      ok = false;
      message = `That's ${gap} days between cycles — a bit longer than the typical range (${CONSTANTS.GAP_MIN_DAYS}–${CONSTANTS.GAP_MAX_DAYS} days). That's okay, cycles vary.`;
    }

    return { ok, gapDays: gap, message };
  }

  /**
   * Validate a single month's input.
   * 
   * @param {Date|string} startDate - Period start date
   * @param {Date|string} endDate - Period end date
   * @returns {{valid: boolean, errors: string[], warnings: string[]}}
   */
  function validateMonthInput(startDate, endDate) {
    const errors = [];
    const warnings = [];
    const start = toDate(startDate);
    const end = toDate(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // End date must be >= start date
    if (end < start) {
      errors.push('The last day cannot be before the first day of your period.');
    }

    // No future dates
    if (start > today) {
      errors.push('The start date cannot be in the future.');
    }
    if (end > today) {
      errors.push('The end date cannot be in the future.');
    }

    // Period length sanity check
    const periodDays = daysBetween(startDate, endDate) + 1;
    if (periodDays > CONSTANTS.WARN_PERIOD_LENGTH) {
      warnings.push(`Your period lasted ${periodDays} days. Periods longer than ${CONSTANTS.MAX_PERIOD_LENGTH} days may be worth discussing with a healthcare provider — but every body is different.`);
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  // =============================================
  // CALENDAR DATA GENERATION
  // =============================================

  /**
   * Generate calendar data for rendering a month view with cycle overlay.
   * 
   * @param {Object} predictions - Output from computeAllPredictions()
   * @param {number} year - Calendar year
   * @param {number} month - Calendar month (0-indexed)
   * @returns {Array} Array of day objects: {date, dayNum, isPeriod, isFertile, isOvulation, isToday}
   */
  function generateMonthCalendarData(predictions, year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = [];

    // Pad the start to align with the correct day of the week (Mon=0)
    let startDow = firstDay.getDay(); // 0=Sun
    startDow = startDow === 0 ? 6 : startDow - 1; // Convert to Mon=0

    for (let pad = 0; pad < startDow; pad++) {
      days.push({ date: null, dayNum: null, isPeriod: false, isFertile: false, isOvulation: false, isToday: false, isPadding: true });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      const dateStr = formatDate(date);

      let isPeriod = false;
      let isFertile = false;
      let isOvulation = false;

      if (predictions) {
        const pStart = formatDate(predictions.nextPeriodStart);
        const pEnd = formatDate(predictions.nextPeriodEnd);
        const fStart = formatDate(predictions.fertileWindowStart);
        const fEnd = formatDate(predictions.fertileWindowEnd);
        const oDate = formatDate(predictions.ovulationDate);

        isPeriod = dateStr >= pStart && dateStr <= pEnd;
        isFertile = dateStr >= fStart && dateStr <= fEnd;
        isOvulation = dateStr === oDate;
      }

      days.push({
        date: dateStr,
        dayNum: d,
        isPeriod,
        isFertile,
        isOvulation,
        isToday: dateStr === formatDate(today),
        isPadding: false
      });
    }

    return days;
  }

  // =============================================
  // PUBLIC API
  // =============================================
  return {
    CONSTANTS,
    // Date utilities
    toDate,
    daysBetween,
    addDays,
    formatDate,
    // Core calculations
    calculateAvgCycleLength,
    calculateAvgPeriodLength,
    predictNextPeriod,
    predictOvulation,
    predictFertileWindow,
    computeAllPredictions,
    // Validation
    validateChronologicalOrder,
    checkGapSanity,
    validateMonthInput,
    // Calendar
    generateMonthCalendarData
  };
})();

// Export for both browser and testing
if (typeof window !== 'undefined') {
  window.CycleCalculator = CycleCalculator;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CycleCalculator;
}
