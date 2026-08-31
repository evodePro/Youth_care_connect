/**
 * YouthCare Connect — Cycle Tracker Renderer
 * Handles all DOM manipulation for the cycle tracker page.
 */

const CycleRenderer = (() => {
  'use strict';

  // DOM Elements
  let container, wizardEl, summaryEl, calendarEl;

  function init() {
    container = document.getElementById('ct-container');
    if (!container) return;

    // Listen to state changes
    CycleState.subscribe(render);

    // Initial Render
    render(CycleState.getState());
  }

  function render(state) {
    if (!state.isLoaded) {
      container.innerHTML = `<div class="text-center p-5"><div class="spinner"></div><p class="mt-3 opacity-70">Loading your cycle history...</p></div>`;
      return;
    }

    container.innerHTML = `
      <div class="ct-header fade-in">
        <h2 class="mb-2">Your Cycle Tracker</h2>
        <p class="opacity-70 mb-4">Track your cycle anonymously. No personal data is stored.</p>
        ${renderDisclaimer()}
      </div>
      
      <div class="ct-layout grid gap-4 ${state.profile.history_complete ? 'ct-layout-complete' : ''}">
        <div class="ct-main-column">
           ${state.profile.history_complete ? renderSummary(state) : renderWizard(state)}
        </div>
        <div class="ct-side-column">
           ${renderPredictions(state)}
           ${state.profile.history_complete ? renderCalendar(state) : renderQuickSetup(state)}
        </div>
      </div>
      
      ${renderPrivacyControls()}
    `;

    attachEventListeners(state);
    
    // Initialize Flatpickr on date inputs
    if (typeof flatpickr !== 'undefined') {
      flatpickr('#ct-setup-lps, .ct-start-date:not([disabled]), .ct-end-date:not([disabled])', {
        dateFormat: 'Y-m-d',
        maxDate: 'today',
        disableMobile: true // Forces the flatpickr UI even on mobile
      });
    }

    // Animate new elements
    if (typeof gsap !== 'undefined') {
       gsap.fromTo('.fade-in-ui', {opacity: 0, y: 10}, {opacity: 1, y: 0, duration: 0.4, stagger: 0.1});
    }
  }

  function renderDisclaimer() {
    return `
      <div class="ct-disclaimer fade-in-ui">
        <span class="icon">ℹ️</span>
        <div>
          <strong>Educational Estimate Only</strong><br/>
          <small>Predictions are based on averages. This is not a medical diagnosis or a guaranteed method for contraception or conception. Real cycles vary due to stress, illness, and age (especially for adolescents).</small>
        </div>
      </div>
    `;
  }

  function renderWizard(state) {
    const loggedCount = state.logs.length;
    let html = `
      <div class="ct-wizard-container card p-4 fade-in-ui">
        <h3 class="mb-3">Building Your History</h3>
        <div class="mb-4">
          <div class="ct-progress">
            <div class="ct-progress-bar" style="width: ${(loggedCount / 6) * 100}%"></div>
          </div>
          <div class="ct-progress-text mt-2">${loggedCount} of 6 months recorded</div>
        </div>
        <div class="ct-wizard-grid">
    `;

    for (let i = 1; i <= 6; i++) {
      const log = state.logs.find(l => l.month_index === i);
      const isCompleted = !!log;
      const isActive = !isCompleted && (i === 1 || !!state.logs.find(l => l.month_index === i - 1));
      const isDisabled = !isCompleted && !isActive;

      html += `
        <div class="ct-month-card ${isCompleted ? 'completed' : (isActive ? 'active' : 'disabled')}" data-month="${i}">
          <div class="ct-month-header">
            <h4>Month ${i}</h4>
            ${isCompleted ? '<span class="ct-check">✓</span>' : ''}
          </div>
          <div class="ct-month-body">
            <div class="form-group mb-2">
              <label>First day of period</label>
              <input type="date" class="ct-start-date" value="${log ? log.period_start_date : ''}" ${isDisabled ? 'disabled' : ''}>
            </div>
            <div class="form-group mb-3">
              <label>Last day of period</label>
              <input type="date" class="ct-end-date" value="${log ? log.period_end_date : ''}" ${isDisabled ? 'disabled' : ''}>
            </div>
            ${!isDisabled ? `<button class="btn btn-primary btn-sm w-100 ct-save-btn" data-month="${i}">${isCompleted ? 'Update' : 'Save Month'}</button>` : ''}
            <div class="ct-error-msg text-danger mt-2" style="display:none; font-size:0.85rem;"></div>
            <div class="ct-warn-msg text-warning mt-2" style="display:none; font-size:0.85rem;"></div>
          </div>
        </div>
      `;
    }

    html += `</div></div>`;
    return html;
  }

  function renderQuickSetup(state) {
    const isReg = state.setup.isRegular;
    const lps = state.setup.lastPeriodStart || '';
    
    return `
      <div class="ct-estimate-card card p-4 mt-4 fade-in-ui">
        <h3 class="mb-2">Cycle Setup</h3>
        <p class="opacity-70 mb-3" style="font-size:0.9rem;">To get predictions now, please tell us about your cycle.</p>
        
        <div class="form-group mb-3">
          <label>First day of your last period</label>
          <input type="date" id="ct-setup-lps" value="${lps}" class="w-100">
        </div>
        
        <div class="form-group mb-3">
          <label class="mb-2">Are your periods regular?</label>
          <div style="display:flex; gap: 16px;">
             <label style="display:flex; align-items:center; gap: 4px; cursor: pointer;">
               <input type="radio" name="ct-setup-regular" value="true" ${isReg ? 'checked' : ''} style="width:auto; margin:0;"> Yes
             </label>
             <label style="display:flex; align-items:center; gap: 4px; cursor: pointer;">
               <input type="radio" name="ct-setup-regular" value="false" ${!isReg ? 'checked' : ''} style="width:auto; margin:0;"> I don't know / Irregular
             </label>
          </div>
        </div>

        <div id="ct-setup-lengths" style="display: ${isReg ? 'grid' : 'none'}; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="form-group">
            <label>Usual Cycle (Days)</label>
            <input type="number" id="ct-setup-cycle" value="${state.setup.cycleLength}" min="21" max="45" class="w-100">
          </div>
          <div class="form-group">
            <label>Usual Period (Days)</label>
            <input type="number" id="ct-setup-period" value="${state.setup.periodLength}" min="1" max="15" class="w-100">
          </div>
        </div>
        <button class="btn btn-outline btn-sm w-100 mt-3" id="ct-update-setup-btn">Show Predictions</button>
      </div>
    `;
  }

  function renderSummary(state) {
    return `
      <div class="ct-summary-card card p-4 fade-in-ui">
        <div class="d-flex justify-content-between align-items-center mb-4">
           <h3 class="m-0">Your Cycle Report</h3>
           <div class="badge badge-success">History Complete</div>
        </div>
        
        <div class="ct-stats-grid mb-4">
          <div class="ct-stat-box">
            <div class="ct-stat-value">${state.profile.avg_cycle_length}</div>
            <div class="ct-stat-label">Avg Cycle Days</div>
          </div>
          <div class="ct-stat-box">
            <div class="ct-stat-value">${state.profile.avg_period_length}</div>
            <div class="ct-stat-label">Avg Period Days</div>
          </div>
        </div>
        <button class="btn btn-primary" id="ct-log-next-btn">Log Next Month</button>
      </div>
    `;
  }

  function renderPredictions(state) {
    const prof = state.profile;
    const hasAnyPredictions = !!prof.fertile_window_start;
    
    if (!hasAnyPredictions) {
      return `
        <div class="ct-predictions-card card p-4 fade-in-ui">
          <h3 class="mb-3">Predictions</h3>
          <p class="opacity-70">Complete the Cycle Setup below, or log a month to see predictions.</p>
        </div>
      `;
    }

    const formatDateStr = (dStr) => {
      if (!dStr) return '';
      const d = new Date(dStr);
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    };

    let nextPeriodHtml = '';
    if (prof.next_period_predicted) {
      nextPeriodHtml = `
        <div class="ct-prediction-item">
          <div class="ct-pred-icon ct-color-period">🩸</div>
          <div class="ct-pred-details">
            <div class="ct-pred-label">Next Period</div>
            <div class="ct-pred-value">${formatDateStr(prof.next_period_predicted)}</div>
          </div>
        </div>
      `;
    } else {
       nextPeriodHtml = `
        <div class="ct-prediction-item">
          <div class="ct-pred-icon ct-color-period">🩸</div>
          <div class="ct-pred-details">
            <div class="ct-pred-label">Next Period</div>
            <div class="ct-pred-value" style="font-size:0.9rem; font-weight:normal; opacity:0.8;">Unpredictable (Irregular cycle)</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="ct-predictions-card card p-4 fade-in-ui">
        <h3 class="mb-3">Upcoming Cycle</h3>
        ${nextPeriodHtml}
        <div class="ct-prediction-item mt-3">
          <div class="ct-pred-icon ct-color-fertile">🌸</div>
          <div class="ct-pred-details">
            <div class="ct-pred-label">Fertile Window</div>
            <div class="ct-pred-value">${formatDateStr(prof.fertile_window_start)} - ${formatDateStr(prof.fertile_window_end)}</div>
          </div>
        </div>
        <div class="ct-prediction-item mt-3">
          <div class="ct-pred-icon ct-color-ovulation">✨</div>
          <div class="ct-pred-details">
            <div class="ct-pred-label">Estimated Ovulation</div>
            <div class="ct-pred-value">${formatDateStr(prof.ovulation_predicted)}</div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCalendar(state) {
    const prof = state.profile;
    if (!prof.next_period_predicted) return '';

    // Render current month
    const today = new Date();
    let year = today.getFullYear();
    let month = today.getMonth();

    // Parse predictions to Date objects for the generator
    const predictionsObj = {
      nextPeriodStart: new Date(prof.next_period_predicted),
      nextPeriodEnd: CycleCalculator.addDays(prof.next_period_predicted, prof.avg_period_length - 1),
      fertileWindowStart: new Date(prof.fertile_window_start),
      fertileWindowEnd: new Date(prof.fertile_window_end),
      ovulationDate: new Date(prof.ovulation_predicted)
    };

    const monthData = CycleCalculator.generateMonthCalendarData(predictionsObj, year, month);
    const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    let daysHtml = '';
    monthData.forEach(d => {
      if (d.isPadding) {
        daysHtml += `<div class="ct-cal-day padding"></div>`;
      } else {
        let classes = ['ct-cal-day'];
        if (d.isToday) classes.push('today');
        if (d.isPeriod) classes.push('period');
        if (d.isFertile) classes.push('fertile');
        if (d.isOvulation) classes.push('ovulation');
        
        daysHtml += `<div class="${classes.join(' ')}">${d.dayNum}</div>`;
      }
    });

    return `
      <div class="ct-calendar-card card p-4 mt-4 fade-in-ui">
        <h3 class="mb-3">${monthName}</h3>
        <div class="ct-cal-legend mb-3">
          <span class="ct-legend-item"><span class="ct-dot period"></span> Period</span>
          <span class="ct-legend-item"><span class="ct-dot fertile"></span> Fertile</span>
          <span class="ct-legend-item"><span class="ct-dot ovulation"></span> Ovulation</span>
        </div>
        <div class="ct-cal-grid">
          <div class="ct-cal-header">M</div><div class="ct-cal-header">T</div><div class="ct-cal-header">W</div>
          <div class="ct-cal-header">T</div><div class="ct-cal-header">F</div><div class="ct-cal-header">S</div><div class="ct-cal-header">S</div>
          ${daysHtml}
        </div>
      </div>
    `;
  }

  function renderPrivacyControls() {
    return `
      <div class="ct-privacy-section mt-5 fade-in-ui">
        <details>
          <summary class="opacity-70">Data Privacy & Controls</summary>
          <div class="card p-4 mt-2">
             <p class="mb-3 opacity-80" style="font-size:0.95rem;">Your data is completely anonymous. It is not tied to your name or account, and is never visible to advisors or admins. If you wish, you can permanently delete all cycle data from this device.</p>
             <button class="btn btn-outline text-danger" id="ct-clear-data-btn" style="border-color:#ef4444;">Clear My Data</button>
          </div>
        </details>
      </div>
    `;
  }

  function attachEventListeners(state) {
    // Save Month buttons
    document.querySelectorAll('.ct-save-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const monthIndex = parseInt(e.target.dataset.month);
        const card = e.target.closest('.ct-month-card');
        const startInput = card.querySelector('.ct-start-date');
        const endInput = card.querySelector('.ct-end-date');
        const errorEl = card.querySelector('.ct-error-msg');
        const warnEl = card.querySelector('.ct-warn-msg');

        errorEl.style.display = 'none';
        warnEl.style.display = 'none';

        if (!startInput.value || !endInput.value) {
          errorEl.textContent = 'Please select both start and end dates.';
          errorEl.style.display = 'block';
          return;
        }

        // Gap sanity check against previous month if it exists
        if (monthIndex > 1) {
          const prevLog = state.logs.find(l => l.month_index === monthIndex - 1);
          if (prevLog) {
             const gapCheck = CycleCalculator.checkGapSanity(prevLog.period_start_date, startInput.value);
             if (!gapCheck.ok && gapCheck.message) {
               // We don't block saving, just show the warning
               warnEl.textContent = gapCheck.message;
               warnEl.style.display = 'block';
             }
          }
        }

        btn.disabled = true;
        btn.textContent = 'Saving...';

        const result = await CycleTracker.logMonth(monthIndex, startInput.value, endInput.value);
        
        if (!result.success) {
          errorEl.innerHTML = result.errors.join('<br>');
          errorEl.style.display = 'block';
          btn.disabled = false;
          btn.textContent = state.logs.find(l=>l.month_index===monthIndex) ? 'Update' : 'Save Month';
        } else {
           if (result.warnings && result.warnings.length > 0) {
              warnEl.innerHTML = result.warnings.join('<br>');
              warnEl.style.display = 'block';
           }
        }
      });
    });

    // Toggle setup inputs based on Regularity
    const radios = document.querySelectorAll('input[name="ct-setup-regular"]');
    const lengthsDiv = document.getElementById('ct-setup-lengths');
    radios.forEach(r => {
       r.addEventListener('change', (e) => {
          if (e.target.value === 'true') {
             lengthsDiv.style.display = 'grid';
          } else {
             lengthsDiv.style.display = 'none';
          }
       });
    });

    // Update Setup button
    const setupBtn = document.getElementById('ct-update-setup-btn');
    if (setupBtn) {
      setupBtn.addEventListener('click', async () => {
        const lps = document.getElementById('ct-setup-lps').value;
        if (!lps) {
           alert("Please enter the first day of your last period.");
           return;
        }

        const isRegular = document.querySelector('input[name="ct-setup-regular"]:checked').value === 'true';
        const cycleLen = document.getElementById('ct-setup-cycle').value;
        const periodLen = document.getElementById('ct-setup-period').value;
        
        setupBtn.disabled = true;
        setupBtn.textContent = 'Updating...';
        
        await CycleTracker.updateSetup({
           isRegular,
           lastPeriodStart: lps,
           cycleLength: cycleLen ? Number(cycleLen) : 28,
           periodLength: periodLen ? Number(periodLen) : 5
        });
      });
    }

    // Log Next Month (shift logs)
    const logNextBtn = document.getElementById('ct-log-next-btn');
    if (logNextBtn) {
       logNextBtn.addEventListener('click', () => {
         // This feature requires shifting all month_index values -1 in supabase and local state,
         // then deleting the oldest. For this MVP, we will just alert that it's coming soon,
         // or provide a simple reset to allow overriding slot 6.
         alert("To log a new month, scroll down to Data Privacy & Controls and clear data to start a new 6-month cycle. Rolling history feature coming soon.");
       });
    }

    // Clear Data button
    const clearBtn = document.getElementById('ct-clear-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to delete all cycle data? This cannot be undone.")) {
          clearBtn.disabled = true;
          clearBtn.textContent = 'Clearing...';
          await CycleTracker.clearAllData();
        }
      });
    }
  }

  return { init };
})();

// Auto-init on DOMContentLoaded if container exists
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('ct-container')) {
    CycleRenderer.init();
    CycleTracker.init();
  }
});

if (typeof window !== 'undefined') {
  window.CycleRenderer = CycleRenderer;
}
