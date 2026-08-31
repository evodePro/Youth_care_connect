/**
 * YouthCare Connect - Step Renderers
 * Reusable rendering functions for different step types
 */

(function() {
  
  // ============================================
  // Mood Selection Step
  // ============================================
  StepRenderers.register('mood-select', (engine, config, state) => {
    const selected = state.answers[config.id]?.mood || '';
    
    return `
      <h2 id="quiz-modal-title">${config.title}</h2>
      <p class="mb-4 text-light">${config.description}</p>
      <form data-form>
        <input type="hidden" name="mood" value="${selected}" />
        <div class="mood-grid">
          ${config.options.map(opt => `
            <button type="button" class="mood-btn ${selected === opt.value ? 'selected' : ''}" 
                    data-mood-value="${opt.value}" 
                    style="--mood-color: ${opt.color}">
              <span style="font-size: 2rem;">${opt.label.split(' ')[0]}</span>
              <span>${opt.label.split(' ').slice(1).join(' ')}</span>
            </button>
          `).join('')}
        </div>
        <button type="submit" class="btn-play mt-4" ${!selected ? 'disabled' : ''}>Continue</button>
      </form>
      <script>
        document.querySelectorAll('.mood-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.querySelector('input[name="mood"]').value = btn.dataset.moodValue;
            document.querySelector('button[type="submit"]').disabled = false;
          });
        });
      </script>
    `;
  });

  // ============================================
  // Text Input Step
  // ============================================
  StepRenderers.register('text-input', (engine, config, state) => {
    const value = state.answers[config.id]?.reflection || '';
    
    return `
      <h2 id="quiz-modal-title">${config.title}</h2>
      <p class="mb-4 text-light">${config.description}</p>
      <form data-form>
        <textarea 
          name="reflection" 
          id="reflection-input"
          placeholder="${config.placeholder || 'Type here...'}"
          maxlength="${config.maxLength || 1000}"
          class="reflection-textarea"
        >${value}</textarea>
        <div class="text-right text-sm text-light mb-3">
          ${value.length}/${config.maxLength || 1000}
        </div>
        <button type="submit" class="btn-play">Continue</button>
      </form>
      <script>
        const textarea = document.getElementById('reflection-input');
        const counter = textarea.parentElement.querySelector('.text-right');
        textarea.addEventListener('input', () => {
          counter.textContent = textarea.value.length + '/' + ${config.maxLength || 1000};
        });
      </script>
    `;
  });

  // ============================================
  // Likert Scale Step
  // ============================================
  StepRenderers.register('likert', (engine, config, state) => {
    const selected = state.answers[config.id]?.value || '';
    const scale = config.scale;
    const step = Math.floor(100 / (scale.max - scale.min + 1));
    
    return `
      <h2 id="quiz-modal-title">${config.title}</h2>
      <p class="mb-4 text-light">${config.description}</p>
      <form data-form>
        <input type="hidden" name="value" value="${selected}" />
        <div class="likert-container">
          <div class="likert-scale">
            ${Array.from({length: scale.max}, (_, i) => i + 1).map(val => `
              <button type="button" class="likert-btn ${selected === String(val) ? 'selected' : ''}" 
                      data-value="${val}" aria-label="${scale.labels[val-1]}">
                ${val}
              </button>
            `).join('')}
          </div>
          <div class="likert-labels">
            <span>${scale.labels[0]}</span>
            <span>${scale.labels[scale.labels.length - 1]}</span>
          </div>
        </div>
        <div class="mt-4 mb-4 text-center">
          <span class="current-label ${selected ? 'visible' : ''}">
            ${selected ? scale.labels[parseInt(selected) - 1] : 'Select a value'}
          </span>
        </div>
        <button type="submit" class="btn-play" ${!selected ? 'disabled' : ''}>Continue</button>
      </form>
      <script>
        document.querySelectorAll('.likert-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.likert-btn').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.querySelector('input[name="value"]').value = btn.dataset.value;
            document.querySelector('.current-label').textContent = btn.getAttribute('aria-label');
            document.querySelector('.current-label').classList.add('visible');
            document.querySelector('button[type="submit"]').disabled = false;
          });
        });
      </script>
    `;
  });

  // ============================================
  // Multi-Select Step
  // ============================================
  StepRenderers.register('multi-select', (engine, config, state) => {
    const selected = state.answers[config.id]?.options || [];
    
    return `
      <h2 id="quiz-modal-title">${config.title}</h2>
      <p class="mb-4 text-light">${config.description}</p>
      <form data-form>
        <div class="multi-options">
          ${config.options.map(opt => `
            <label class="multi-option ${selected.includes(opt.value) ? 'selected' : ''}">
              <input type="checkbox" name="options" value="${opt.value}" 
                ${selected.includes(opt.value) ? 'checked' : ''} />
              <span class="option-check">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </span>
              <span class="option-text">${opt.label}</span>
            </label>
          `).join('')}
        </div>
        <button type="submit" class="btn-play mt-4">Continue</button>
      </form>
    `;
  });

  // ============================================
  // Checkbox Step
  // ============================================
  StepRenderers.register('checkbox', (engine, config, state) => {
    const selected = state.answers[config.id]?.options || [];
    
    return `
      <h2 id="quiz-modal-title">${config.title}</h2>
      <p class="mb-4 text-light">${config.description}</p>
      <form data-form>
        <div class="checkbox-grid">
          ${config.options.map(opt => `
            <label class="checkbox-option ${selected.includes(opt.value) ? 'selected' : ''}">
              <input type="checkbox" name="options" value="${opt.value}" 
                ${selected.includes(opt.value) ? 'checked' : ''} />
              <span class="checkbox-box"></span>
              <span class="checkbox-label">${opt.label}</span>
            </label>
          `).join('')}
        </div>
        <button type="submit" class="btn-play mt-4">Continue</button>
      </form>
    `;
  });

  // ============================================
  // True/False Step
  // ============================================
  StepRenderers.register('true-false', (engine, config, state) => {
    const answered = state.answers[config.id]?.answer !== undefined;
    const answeredCorrect = answered ? 
      (state.answers[config.id].answer === 'true') === config.correctAnswer : null;
    
    if (answered) {
      return `
        <div class="answer-card ${answeredCorrect ? 'correct' : 'incorrect'}">
          <h2>${answeredCorrect ? 'Correct! 🎉' : 'Not quite right 🤔'}</h2>
          <p class="mt-3" style="font-size: 1.1rem; line-height: 1.6;">${config.explanation}</p>
        </div>
        <button class="btn-play mt-4" data-action="next">Next Question</button>
      `;
    }
    
    return `
      <div class="quiz-progress-bar mb-4">
        <div class="quiz-progress-fill" style="width: ${state.currentStep / engine.activeQuiz.definition.steps.length * 100}%"></div>
      </div>
      <h4 class="mb-2 text-light">Question ${state.currentStep + 1}</h4>
      <h2 class="mb-5" style="line-height: 1.4;">${config.description}</h2>
      <form data-form>
        <input type="hidden" name="answer" />
        <div class="flex-gap">
          <button type="button" class="btn-play btn-true" data-true-false="true">True</button>
          <button type="button" class="btn-play btn-false" data-true-false="false">False</button>
        </div>
      </form>
      <script>
        document.querySelectorAll('[data-true-false]').forEach(btn => {
          btn.addEventListener('click', () => {
            const form = btn.closest('form');
            form.querySelector('input[name="answer"]').value = btn.dataset.trueFalse;
            const e = new Event('submit', { bubbles: true });
            form.dispatchEvent(e);
          });
        });
      </script>
    `;
  });

  // ============================================
  // Multiple Choice Step
  // ============================================
  StepRenderers.register('multiple-choice', (engine, config, state) => {
    const answered = state.answers[config.id]?.answer !== undefined;
    const answeredCorrect = answered ? 
      state.answers[config.id].answer === config.correctAnswer : null;
    
    if (answered) {
      return `
        <div class="answer-card ${answeredCorrect ? 'correct' : 'incorrect'}">
          <h2>${answeredCorrect ? 'Correct! 🎉' : 'Let\'s learn from this'}</h2>
          <p class="mt-3" style="font-size: 1.1rem; line-height: 1.6;">${config.explanation}</p>
        </div>
        <button class="btn-play mt-4" data-action="next">Next Question</button>
      `;
    }
    
    return `
      <div class="quiz-progress-bar mb-4">
        <div class="quiz-progress-fill" style="width: ${state.currentStep / engine.activeQuiz.definition.steps.length * 100}%"></div>
      </div>
      <h4 class="mb-2 text-light">Question ${state.currentStep + 1}</h4>
      <h2 class="mb-4" style="line-height: 1.4;">${config.description}</h2>
      <form data-form>
        <input type="hidden" name="answer" value="" />
        <div class="options-list">
          ${config.options.map(opt => `
            <button type="button" class="option-btn" data-option="${opt.value}">
              ${opt.label}
            </button>
          `).join('')}
        </div>
      </form>
      <script>
        document.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const form = btn.closest('form');
            form.querySelector('input[name="answer"]').value = btn.dataset.option;
            const e = new Event('submit', { bubbles: true });
            form.dispatchEvent(e);
          });
        });
      </script>
    `;
  });

  // ============================================
  // Scenario Step
  // ============================================
  StepRenderers.register('scenario', (engine, config, state) => {
    const answered = state.answers[config.id]?.options?.length > 0;
    
    if (answered) {
      const answers = state.answers[config.id].options;
      const correctAnswers = config.options.filter(o => o.correct).map(o => o.value);
      const isAnyCorrect = answers.some(a => correctAnswers.includes(a));
      
      return `
        <div class="answer-card ${isAnyCorrect ? 'correct' : 'feedback'}">
          <h2>${isAnyCorrect ? 'Great thinking!' : 'Let\'s reflect...'}</h2>
          <div class="mt-4">
            ${config.options.map(opt => {
              const wasSelected = answers.includes(opt.value);
              const wasCorrect = opt.correct;
              let feedback = '';
              
              if (wasSelected) {
                feedback = wasCorrect ? 
                  `<span style="color: #10B981;">✓ ${opt.feedback}</span>` :
                  `<span style="color: #F59E0B;">→ ${opt.feedback}</span>`;
              }
              
              return wasSelected ? `<p class="mb-2">${feedback}</p>` : '';
            }).join('')}
          </div>
        </div>
        <button class="btn-play mt-4" data-action="next">Continue</button>
      `;
    }
    
    return `
      <div class="quiz-progress-bar mb-4">
        <div class="quiz-progress-fill" style="width: ${state.currentStep / engine.activeQuiz.definition.steps.length * 100}%"></div>
      </div>
      <h2 class="mb-3">${config.title}</h2>
      <p class="mb-4 text-light" style="font-size: 1.1rem; line-height: 1.6;">${config.description}</p>
      <form data-form>
        <input type="hidden" name="options" value="" />
        <div class="scenario-options">
          ${config.options.map((opt, i) => `
            <label class="scenario-option">
              <input type="checkbox" name="options" value="${opt.value}" />
              <span class="scenario-option-content">
                <span class="option-number">${i + 1}</span>
                <span>${opt.label}</span>
              </span>
            </label>
          `).join('')}
        </div>
        <button type="submit" class="btn-play mt-4" ${answered ? '' : ''}>Submit</button>
      </form>
    `;
  });

  // ============================================
  // Completion Step (for simple check-ins)
  // ============================================
  StepRenderers.register('completion', (engine, config, state) => {
    const mood = state.answers['mood-selection']?.mood;
    const moodLabel = {
      great: 'It\'s wonderful to hear you\'re feeling great!',
      good: 'Good feelings matter. Hope your day stays positive!',
      okay: 'It\'s okay to feel okay. Feelings fluctuate and that\'s normal.',
      down: 'It sounds like you\'re having a tough time. Remember: this feeling won\'t last forever.',
      stressed: 'Being stressed is tough. Try to take some small breaks today.'
    }[mood] || 'Thank you for checking in.';
    
    return `
      <div class="text-center">
        <div class="success-icon">✨</div>
        <h2>Check-in Complete</h2>
        <p style="font-size: 1.1rem; margin: 20px 0;">${moodLabel}</p>
        <div class="xp-reward">+${config.xp || 10} XP Earned</div>
        <button class="btn-play mt-4" data-action="close">Finish</button>
      </div>
    `;
  });

  // ============================================
  // Results Step
  // ============================================
  StepRenderers.register('results', (engine, config, state) => {
    const { definition, results, state: quizState } = config;
    
    return `
      <div class="text-center">
        <div class="results-icon ${results.level || 'default'}">
          ${results.level === 'high' || results.level === 'good' || results.level === 'healthy' || results.level === 'manageable' ? '🌟' : 
            results.level === 'medium' || results.level === 'developing' || results.level === 'learning' ? '💪' : '🤔'}
        </div>
        <h2>Your Results</h2>
        
        ${results.percentage !== undefined ? `
          <div class="results-score">
            <div class="score-ring">
              <svg viewBox="0 0 36 36" class="circular-chart">
                <path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="circle" stroke-dasharray="${results.percentage}, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="score-value">${results.percentage}%</span>
            </div>
          </div>
        ` : ''}
        
        <p class="results-message">${results.message || results.interpretation?.message || 'Thank you for completing this assessment.'}</p>
        
        ${results.suggestions && results.suggestions.length > 0 ? `
          <div class="results-suggestions">
            <h4>Suggestions for you:</h4>
            <ul>
              ${results.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <div class="xp-reward">+${definition.xpReward || 0} XP Earned</div>
        
        <div class="results-actions">
          <button class="btn-play" data-action="close">Finish</button>
        </div>
      </div>
    `;
  });

  // ============================================
  // Quiz Results Step (for trivia-style quizzes)
  // ============================================
  StepRenderers.register('quiz-results', (engine, config, state) => {
    const { definition, results } = config;
    
    return `
      <div class="text-center">
        <div class="success-icon">${results.percentage >= 60 ? '🎉' : '📚'}</div>
        <h2>Quiz Complete!</h2>
        
        <div class="quiz-score-display">
          <span class="score-big">${results.score}</span>
          <span class="score-divider">/</span>
          <span class="score-total">${results.maxScore}</span>
        </div>
        
        <p class="results-message">${results.message}</p>
        
        ${results.suggestions ? `
          <div class="results-suggestions">
            ${results.suggestions.map(s => `<p>• ${s}</p>`).join('')}
          </div>
        ` : ''}
        
        <div class="xp-reward">+${definition.xpReward || 0} XP Earned</div>
        
        <button class="btn-play mt-4" data-action="close">Finish</button>
      </div>
    `;
  });

})();

window.StepRenderers = StepRenderers;