/**
 * YouthCare Connect - Quiz System Complete Bundle
 * All modules combined for easy inclusion
 * Version 2.0 - Modular Architecture
 */

(function(global) {
  'use strict';

  // ============================================
  // PART 1: CORE CLASSES
  // ============================================

  /**
   * QuizModal - Reusable modal component
   */
  var QuizModal = function(overlayId) {
    this.overlayId = overlayId;
    this.overlay = null;
  };

  QuizModal.prototype.open = function(content, onMount) {
    this.ensureOverlay();
    this.overlay.innerHTML = '';
    
    var modal = document.createElement('div');
    modal.className = 'quiz-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'quiz-modal-title');
    
    modal.innerHTML = `
      <button class="quiz-close-btn" aria-label="Close quiz" data-action="close">&times;</button>
      <div id="quiz-modal-content" class="quiz-modal-content">${content}</div>
      <div class="quiz-disclaimer">
        YouthCare Connect provides educational wellness support and does not replace emergency or professional medical care.
      </div>
    `;
    
    this.overlay.appendChild(modal);
    this.overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    var self = this;
    setTimeout(function() {
      var container = document.getElementById('quiz-modal-content');
      if (onMount) onMount(container);
      
      var closeBtn = modal.querySelector('[data-action="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          self.close();
        });
      }
    }, 10);
  };

  QuizModal.prototype.ensureOverlay = function() {
    this.overlay = document.getElementById(this.overlayId);
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.id = this.overlayId;
      this.overlay.className = 'quiz-overlay';
      document.body.appendChild(this.overlay);
    }
  };

  QuizModal.prototype.close = function() {
    if (this.overlay) {
      var modal = this.overlay.querySelector('.quiz-modal');
      if (modal) {
        modal.style.transform = 'translateY(20px)';
        modal.style.opacity = '0';
      }
      
      setTimeout(function() {
        this.overlay.classList.remove('active');
        document.body.style.overflow = '';
        this.overlay.innerHTML = '';
      }.bind(this), 300);
    }
  };

  /**
   * ProgressTracker - Save/load quiz progress
   */
  var ProgressTracker = function(enabled) {
    this.enabled = enabled;
    this.storageKey = 'ycc_quiz_progress';
  };

  ProgressTracker.prototype.save = function(quizId, data) {
    if (!this.enabled) return;
    var all = this.getAll();
    all[quizId] = data;
    localStorage.setItem(this.storageKey, JSON.stringify(all));
  };

  ProgressTracker.prototype.get = function(quizId) {
    if (!this.enabled) return null;
    var all = this.getAll();
    return all[quizId] || null;
  };

  ProgressTracker.prototype.getAll = function() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey)) || {};
    } catch (e) {
      return {};
    }
  };

  /**
   * SafetyInterceptor - Detect and handle safety concerns
   */
  var SafetyInterceptor = function() {
    this.triggerWords = ['suicide', 'kill myself', 'harm myself', 'end it all', 'hurt myself', 'want to die', 'better off dead'];
    this.emergencyContacts = { emergency: '112', crisis: '+250 791 844 573' };
  };

  SafetyInterceptor.prototype.check = function(text) {
    if (!text) return false;
    var lower = text.toLowerCase();
    return this.triggerWords.some(function(word) {
      return lower.includes(word);
    });
  };

  SafetyInterceptor.prototype.renderSafetyScreen = function() {
    return `
      <div class="safe-screen text-center">
        <div class="safe-icon">🛡️</div>
        <h2 id="quiz-modal-title">You are not alone.</h2>
        <p>It sounds like you might be going through a difficult time. Your safety matters.</p>
        <div class="safe-card">
          <p><strong>YouthCare Connect is an educational platform and cannot provide emergency support.</strong></p>
          <p>Please reach out to someone who can help keep you safe:</p>
          <ul class="safe-list">
            <li>📞 Emergency: <strong>${this.emergencyContacts.emergency}</strong></li>
            <li>💬 Crisis Hotline: <strong>${this.emergencyContacts.crisis}</strong></li>
            <li>🧑‍⚕️ Talk to a trusted teacher, counselor, or family member.</li>
          </ul>
        </div>
        <button class="btn-play mt-4" data-action="close">I understand, take me back</button>
      </div>
    `;
  };

  /**
   * QuizAnalytics - Track engagement metrics
   */
  var QuizAnalytics = function(enabled) {
    this.enabled = enabled;
    this.sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  QuizAnalytics.prototype.trackEvent = function(eventName, data) {
    if (!this.enabled) return;
    var event = { event: eventName, timestamp: Date.now(), sessionId: this.sessionId };
    Object.assign(event, data);
    var events = this.getEvents();
    events.push(event);
    localStorage.setItem('ycc_analytics', JSON.stringify(events.slice(-100)));
  };

  QuizAnalytics.prototype.getEvents = function() {
    try {
      return JSON.parse(localStorage.getItem('ycc_analytics')) || [];
    } catch (e) {
      return [];
    }
  };

  /**
   * DefaultScorer - Default scoring logic
   */
  var DefaultScorer = function(answers, definition) {
    var total = Object.keys(answers).length;
    var score = 0;
    var maxScore = 0;
    
    Object.entries(answers).forEach(function(entry) {
      var stepId = entry[0];
      var answer = entry[1];
      var step = definition.steps.find(function(s) {
        return s.id === stepId;
      });
      
      if (step && step.scoring) {
        var result = step.scoring(answer);
        score += result.score;
        maxScore += result.maxScore;
      }
    });
    
    var percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    return {
      score: score,
      maxScore: maxScore,
      percentage: percentage,
      level: percentage >= 80 ? 'high' : percentage >= 50 ? 'medium' : 'low',
      message: 'Thank you for completing this assessment.'
    };
  };

  // ============================================
  // PART 2: QUIZ ENGINE
  // ============================================

  var QuizEngine = function(options) {
    this.options = Object.assign({
      containerSelector: '#quiz-modal-content',
      overlayId: 'quiz-engine-overlay',
      xpEnabled: true,
      saveProgress: true,
      analyticsEnabled: true
    }, options);
    
    this.activeQuiz = null;
    this.modal = null;
    this.state = {};
    this.listeners = new Map();
    
    this.init();
  };

  QuizEngine.prototype.init = function() {
    this.modal = new QuizModal(this.options.overlayId);
    this.analytics = new QuizAnalytics(this.options.analyticsEnabled);
    this.safety = new SafetyInterceptor();
    this.progress = new ProgressTracker(this.options.saveProgress);
    this.registerDefaultListeners();
  };

  QuizEngine.prototype.registerDefaultListeners = function() {
    var self = this;
    this.on('quiz:start', function(data) {
      self.analytics.trackEvent('quiz_started', data);
    });
    this.on('quiz:complete', function(data) {
      self.analytics.trackEvent('quiz_completed', data);
      if (self.options.xpEnabled) {
        self.awardXP(data.xp || 0);
      }
    });
    this.on('question:answer', function(data) {
      self.analytics.trackEvent('question_answered', data);
    });
  };

  QuizEngine.prototype.on = function(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  };

  QuizEngine.prototype.emit = function(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(function(cb) {
        cb(data);
      });
    }
  };

  QuizEngine.prototype.launchQuiz = function(quizId, params) {
    var quizDef = QuizRegistry.get(quizId);
    if (!quizDef) {
      console.error('Quiz not found: ' + quizId);
      return;
    }

    this.activeQuiz = {
      id: quizId,
      definition: quizDef,
      state: this.createQuizState(quizDef),
      params: params
    };

    this.emit('quiz:start', { quizId: quizId, title: quizDef.title });
    this.renderCurrentStep();
  };

  QuizEngine.prototype.createQuizState = function(quizDef) {
    return {
      currentStep: 0,
      answers: {},
      score: 0,
      timeSpent: 0,
      startedAt: Date.now(),
      history: []
    };
  };

  QuizEngine.prototype.renderCurrentStep = function() {
    if (!this.activeQuiz) return;

    var self = this;
    var definition = this.activeQuiz.definition;
    var state = this.activeQuiz.state;
    var stepConfig = definition.steps[state.currentStep];
    
    if (!stepConfig) {
      this.handleQuizComplete();
      return;
    }

    var stepRenderer = StepRenderers.get(stepConfig.type);
    var stepContent = stepRenderer(this, stepConfig, state);
    
    this.modal.open(stepContent, function(container) {
      self.bindStepEvents(container, stepConfig);
    });
  };

  QuizEngine.prototype.bindStepEvents = function(container, stepConfig) {
    var self = this;
    var form = container.querySelector('[data-form]');
    
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        self.handleStepSubmit(form, stepConfig);
      });
    }

    container.querySelectorAll('[data-action]').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        var action = btn.dataset.action;
        self.handleAction(action, btn, stepConfig);
      });
    });

    // Event listeners for custom inputs (since innerHTML doesn't execute <script> tags)
    
    // Mood Select
    container.querySelectorAll(".mood-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        container.querySelectorAll(".mood-btn").forEach(function(b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        if (form && form.querySelector("input[name='mood']")) {
          form.querySelector("input[name='mood']").value = btn.dataset.moodValue;
        }
        var submitBtn = container.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = false;
      });
    });

    // Likert Scale
    container.querySelectorAll(".likert-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        container.querySelectorAll(".likert-btn").forEach(function(b) { b.classList.remove("selected"); });
        btn.classList.add("selected");
        if (form && form.querySelector("input[name='value']")) {
          form.querySelector("input[name='value']").value = btn.dataset.value;
        }
        var label = container.querySelector(".current-label");
        if (label) {
          label.textContent = btn.getAttribute("aria-label");
          label.classList.add("visible");
        }
        var submitBtn = container.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.disabled = false;
      });
    });

    // Text Input Length Counter
    var reflectionInput = container.querySelector("#reflection-input");
    if (reflectionInput) {
      reflectionInput.addEventListener("input", function() {
        var counter = reflectionInput.parentElement.querySelector(".text-right");
        if (counter) {
          var max = reflectionInput.getAttribute("maxlength") || 1000;
          counter.textContent = reflectionInput.value.length + "/" + max;
        }
      });
    }

    // True/False
    container.querySelectorAll("[data-true-false]").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var form = btn.closest("form");
        if (form && form.querySelector("input[name='answer']")) {
          form.querySelector("input[name='answer']").value = btn.dataset.trueFalse;
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      });
    });

    // Multiple Choice
    container.querySelectorAll(".option-btn").forEach(function(btn) {
      btn.addEventListener("click", function() {
        var form = btn.closest("form");
        if (form && form.querySelector("input[name='answer']")) {
          form.querySelector("input[name='answer']").value = btn.dataset.option;
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      });
    });

    // Checkboxes (Multi-select, Checkbox-grid)
    container.querySelectorAll("input[type='checkbox']").forEach(function(checkbox) {
      checkbox.addEventListener("change", function() {
        var label = checkbox.closest('.multi-option, .checkbox-option, .scenario-option');
        if (label) {
          if (checkbox.checked) {
            label.classList.add('selected');
          } else {
            label.classList.remove('selected');
          }
        }
      });
    });
  };

  QuizEngine.prototype.handleStepSubmit = function(form, stepConfig) {
    var formData = new FormData(form);
    var answers = {};
    formData.forEach(function(value, key) {
      if (answers[key]) {
        if (Array.isArray(answers[key])) {
          answers[key].push(value);
        } else {
          answers[key] = [answers[key], value];
        }
      } else {
        answers[key] = (key === 'options') ? [value] : value;
      }
    });
    
    this.activeQuiz.state.answers[stepConfig.id] = answers;
    this.activeQuiz.state.history.push({
      step: stepConfig.id,
      answer: answers,
      timestamp: Date.now()
    });

    this.emit('question:answer', {
      quizId: this.activeQuiz.id,
      stepId: stepConfig.id,
      answers: answers
    });

    if (stepConfig.onSubmit) {
      stepConfig.onSubmit(this, answers);
    }

    this.nextStep();
  };

  QuizEngine.prototype.handleAction = function(action, btn, stepConfig) {
    switch (action) {
      case 'next':
        this.nextStep();
        break;
      case 'prev':
        this.prevStep();
        break;
      case 'finish':
        this.finishQuiz();
        break;
      case 'close':
        this.closeQuiz();
        break;
      default:
        if (stepConfig.actions && stepConfig.actions[action]) {
          stepConfig.actions[action](this, btn);
        }
    }
  };

  QuizEngine.prototype.nextStep = function() {
    if (!this.activeQuiz) return;
    
    if (this.activeQuiz.state.currentStep < this.activeQuiz.definition.steps.length - 1) {
      this.activeQuiz.state.currentStep++;
      var stepConfig = this.activeQuiz.definition.steps[this.activeQuiz.state.currentStep];
      if (stepConfig.type === 'results' || stepConfig.type === 'quiz-results') {
        this.handleQuizComplete();
      } else {
        this.renderCurrentStep();
      }
    } else {
      this.handleQuizComplete();
    }
  };

  QuizEngine.prototype.prevStep = function() {
    if (!this.activeQuiz) return;
    
    if (this.activeQuiz.state.currentStep > 0) {
      this.activeQuiz.state.currentStep--;
      this.renderCurrentStep();
    }
  };

  QuizEngine.prototype.handleQuizComplete = function() {
    if (!this.activeQuiz) return;

    var definition = this.activeQuiz.definition;
    var state = this.activeQuiz.state;
    
    state.completedAt = Date.now();
    state.timeSpent = state.completedAt - state.startedAt;

    var results = this.calculateResults(definition, state);
    
    this.emit('quiz:complete', {
      quizId: this.activeQuiz.id,
      score: state.score,
      results: results,
      xp: definition.xpReward || 0
    });

    this.progress.save(this.activeQuiz.id, {
      completed: true,
      score: state.score,
      results: results,
      timestamp: Date.now()
    });

    var resultType = 'results';
    var lastStep = definition.steps[definition.steps.length - 1];
    if (lastStep && (lastStep.type === 'results' || lastStep.type === 'quiz-results')) {
      resultType = lastStep.type;
    }
    
    var resultRenderer = StepRenderers.get(resultType);
    var resultContent = resultRenderer(this, { definition: definition, results: results, state: state });
    
    var self = this;
    this.modal.open(resultContent, function(container) {
      var closeBtn = container.querySelector('[data-action="close"]');
      if (closeBtn) {
        closeBtn.addEventListener('click', function() {
          self.closeQuiz();
        });
      }
    });
  };

  QuizEngine.prototype.calculateResults = function(definition, state) {
    var scorer = definition.scorer || DefaultScorer;
    
    var normalizedAnswers = {};
    Object.keys(state.answers).forEach(function(stepId) {
      var stepAns = state.answers[stepId];
      if (!stepAns || typeof stepAns !== 'object') return;
      
      if (stepAns.options !== undefined) {
        normalizedAnswers[stepId] = Array.isArray(stepAns.options) ? stepAns.options : [stepAns.options];
      } else if (stepAns.value !== undefined) {
        normalizedAnswers[stepId] = stepAns.value;
      } else if (stepAns.answer !== undefined) {
        normalizedAnswers[stepId] = stepAns.answer;
      } else if (stepAns.mood !== undefined) {
        normalizedAnswers[stepId] = stepAns.mood;
      } else if (stepAns.reflection !== undefined) {
        normalizedAnswers[stepId] = stepAns.reflection;
      } else {
        normalizedAnswers[stepId] = stepAns;
      }
    });

    return scorer(normalizedAnswers, definition);
  };

  QuizEngine.prototype.awardXP = function(amount) {
    if (!this.options.xpEnabled || amount <= 0) return;
    
    var currentXP = parseInt(localStorage.getItem('ycc_xp')) || 0;
    var newXP = currentXP + amount;
    localStorage.setItem('ycc_xp', newXP);
    
    this.analytics.trackEvent('xp_earned', { amount: amount, total: newXP });
    
    var xpCounter = document.getElementById('xpCounter');
    if (xpCounter) xpCounter.textContent = newXP;
  };

  QuizEngine.prototype.closeQuiz = function() {
    this.modal.close();
    this.activeQuiz = null;
  };

  QuizEngine.prototype.finishQuiz = function() {
    this.handleQuizComplete();
  };

  QuizEngine.prototype.getQuizList = function() {
    return QuizRegistry.listAll();
  };

  QuizEngine.prototype.getProgress = function(quizId) {
    return this.progress.get(quizId);
  };

  // ============================================
  // PART 3: REGISTRY SYSTEM
  // ============================================

  var QuizRegistry = (function() {
    var quizzes = {};

    function register(quiz) {
      quizzes[quiz.id] = Object.assign({ registeredAt: Date.now() }, quiz);
      return quiz;
    }

    function get(id) {
      return quizzes[id] || null;
    }

    function listAll() {
      return Object.values(quizzes).map(function(q) {
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          category: q.category,
          duration: q.duration,
          difficulty: q.difficulty,
          xpReward: q.xpReward,
          icon: q.icon
        };
      });
    }

    function getByCategory(category) {
      return Object.values(quizzes).filter(function(q) {
        return q.category === category;
      });
    }

    function search(query) {
      var lower = query.toLowerCase();
      return Object.values(quizzes).filter(function(q) {
        return q.title.toLowerCase().includes(lower) || q.description.toLowerCase().includes(lower);
      });
    }

    return { register: register, get: get, listAll: listAll, getByCategory: getByCategory, search: search };
  })();

  var StepRenderers = (function() {
    var renderers = {};

    function register(type, renderer) {
      renderers[type] = renderer;
    }

    function get(type) {
      return renderers[type] || defaultRenderer;
    }

    function defaultRenderer(engine, config, state) {
      return '<div class="step-render"><p>Step type "' + config.type + '" not implemented</p><button class="btn-play" data-action="next">Continue</button></div>';
    }

    return { register: register, get: get };
  })();

  // ============================================
  // PART 4: STEP RENDERERS
  // ============================================

  // Mood Selection
  StepRenderers.register('mood-select', function(engine, config, state) {
    var selected = (state.answers[config.id] && state.answers[config.id].mood) || '';
    var html = '<h2 id="quiz-modal-title">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<form data-form>';
    html += '<input type="hidden" name="mood" value="' + selected + '" />';
    html += '<div class="mood-grid">';
    
    config.options.forEach(function(opt) {
      var selClass = selected === opt.value ? ' selected' : '';
      var labelParts = opt.label.split(' ');
      html += '<button type="button" class="mood-btn' + selClass + '" data-mood-value="' + opt.value + '">';
      html += '<span style="font-size: 2rem;">' + labelParts[0] + '</span>';
      html += '<span>' + labelParts.slice(1).join(' ') + '</span></button>';
    });
    
    html += '</div>';
    html += '<button type="submit" class="btn-play mt-4"' + (!selected ? ' disabled' : '') + '>Continue</button>';
    html += '</form>';
    return html;
  });

  // Text Input
  StepRenderers.register('text-input', function(engine, config, state) {
    var value = (state.answers[config.id] && state.answers[config.id].reflection) || '';
    var maxLen = config.maxLength || 1000;
    var html = '<h2 id="quiz-modal-title">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<form data-form>';
    html += '<textarea name="reflection" id="reflection-input" placeholder="' + (config.placeholder || 'Type here...') + '" maxlength="' + maxLen + '" class="reflection-textarea">' + value + '</textarea>';
    html += '<div class="text-right text-sm text-light mb-3">' + value.length + '/' + maxLen + '</div>';
    html += '<button type="submit" class="btn-play">Continue</button>';
    html += '</form>';
    return html;
  });

  // Likert Scale
  StepRenderers.register('likert', function(engine, config, state) {
    var selected = (state.answers[config.id] && state.answers[config.id].value) || '';
    var scale = config.scale;
    var html = '<h2 id="quiz-modal-title">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<form data-form>';
    html += '<input type="hidden" name="value" value="' + selected + '" />';
    html += '<div class="likert-container"><div class="likert-scale">';
    
    for (var i = scale.min; i <= scale.max; i++) {
      var selClass = selected === String(i) ? ' selected' : '';
      html += '<button type="button" class="likert-btn' + selClass + '" data-value="' + i + '" aria-label="' + scale.labels[i-1] + '">' + i + '</button>';
    }
    
    html += '</div><div class="likert-labels"><span>' + scale.labels[0] + '</span><span>' + scale.labels[scale.labels.length - 1] + '</span></div></div>';
    html += '<div class="mt-4 mb-4 text-center"><span class="current-label' + (selected ? ' visible' : '') + '">' + (selected ? scale.labels[parseInt(selected)-1] : 'Select a value') + '</span></div>';
    html += '<button type="submit" class="btn-play"' + (!selected ? ' disabled' : '') + '>Continue</button>';
    html += '</form>';
    return html;
  });

  // Info / Reading Step
  StepRenderers.register('info', function(engine, config, state) {
    var html = '<h2 id="quiz-modal-title" style="margin-bottom:1rem;">' + config.title + '</h2>';
    html += '<div style="background:var(--color-card-bg); padding:20px; border-radius:12px; border-left: 4px solid var(--color-accent); font-size:1.05rem; line-height:1.7; color:var(--color-text); margin-bottom: 24px;">';
    html += config.content;
    html += '</div>';
    html += '<form data-form>';
    html += '<button type="submit" class="btn-play">I\'ve read this - Continue</button>';
    html += '</form>';
    return html;
  });

  // Multi-Select
  StepRenderers.register('multi-select', function(engine, config, state) {
    var selected = (state.answers[config.id] && state.answers[config.id].options) || [];
    var html = '<h2 id="quiz-modal-title">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<form data-form><div class="multi-options">';
    
    config.options.forEach(function(opt) {
      var sel = selected.includes(opt.value) ? ' selected' : '';
      html += '<label class="multi-option' + sel + '">';
      html += '<input type="checkbox" name="options" value="' + opt.value + '"' + (selected.includes(opt.value) ? ' checked' : '') + ' />';
      html += '<span class="option-check"></span>';
      html += '<span class="option-text">' + opt.label + '</span></label>';
    });
    
    html += '</div><button type="submit" class="btn-play mt-4">Continue</button></form>';
    return html;
  });

  // Checkbox
  StepRenderers.register('checkbox', function(engine, config, state) {
    var selected = (state.answers[config.id] && state.answers[config.id].options) || [];
    var html = '<h2 id="quiz-modal-title">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<form data-form><div class="checkbox-grid">';
    
    config.options.forEach(function(opt) {
      var sel = selected.includes(opt.value) ? ' selected' : '';
      html += '<label class="checkbox-option' + sel + '">';
      html += '<input type="checkbox" name="options" value="' + opt.value + '"' + (selected.includes(opt.value) ? ' checked' : '') + ' />';
      html += '<span class="checkbox-box"></span>';
      html += '<span class="checkbox-label">' + opt.label + '</span></label>';
    });
    
    html += '</div><button type="submit" class="btn-play mt-4">Continue</button></form>';
    return html;
  });

  // True/False
  StepRenderers.register('true-false', function(engine, config, state) {
    var answered = state.answers[config.id] && state.answers[config.id].answer !== undefined;
    
    if (answered) {
      var answeredCorrect = (state.answers[config.id].answer === 'true') === config.correctAnswer;
      return '<div class="answer-card ' + (answeredCorrect ? 'correct' : 'incorrect') + '"><h2>' + (answeredCorrect ? 'Correct! 🎉' : 'Not quite right 🤔') + '</h2><p class="mt-3" style="font-size: 1.1rem; line-height: 1.6;">' + config.explanation + '</p></div><button class="btn-play mt-4" data-action="next">Next Question</button>';
    }
    
    var progress = (state.currentStep / engine.activeQuiz.definition.steps.length) * 100;
    var html = '<div class="quiz-progress-bar mb-4"><div class="quiz-progress-fill" style="width: ' + progress + '%"></div></div>';
    html += '<h4 class="mb-2 text-light">Question ' + (state.currentStep + 1) + '</h4>';
    html += '<h2 class="mb-5" style="line-height: 1.4;">' + config.description + '</h2>';
    html += '<form data-form><input type="hidden" name="answer" /><div class="flex-gap">';
    html += '<button type="button" class="btn-play btn-true" data-true-false="true">True</button>';
    html += '<button type="button" class="btn-play btn-false" data-true-false="false">False</button>';
    html += '</div></form>';
    return html;
  });

  // Multiple Choice
  StepRenderers.register('multiple-choice', function(engine, config, state) {
    var answered = state.answers[config.id] && state.answers[config.id].answer !== undefined;
    
    if (answered) {
      var answeredCorrect = state.answers[config.id].answer === config.correctAnswer;
      return '<div class="answer-card ' + (answeredCorrect ? 'correct' : 'incorrect') + '"><h2>' + (answeredCorrect ? 'Correct! 🎉' : 'Let\'s learn from this') + '</h2><p class="mt-3" style="font-size: 1.1rem; line-height: 1.6;">' + config.explanation + '</p></div><button class="btn-play mt-4" data-action="next">Next Question</button>';
    }
    
    var progress = (state.currentStep / engine.activeQuiz.definition.steps.length) * 100;
    var html = '<div class="quiz-progress-bar mb-4"><div class="quiz-progress-fill" style="width: ' + progress + '%"></div></div>';
    html += '<h4 class="mb-2 text-light">Question ' + (state.currentStep + 1) + '</h4>';
    html += '<h2 class="mb-4" style="line-height: 1.4;">' + config.description + '</h2>';
    html += '<form data-form><input type="hidden" name="answer" value="" /><div class="options-list">';
    
    config.options.forEach(function(opt) {
      html += '<button type="button" class="option-btn" data-option="' + opt.value + '">' + opt.label + '</button>';
    });
    
    html += '</div></form>';
    return html;
  });

  // Scenario
  StepRenderers.register('scenario', function(engine, config, state) {
    var answered = state.answers[config.id] && state.answers[config.id].options && state.answers[config.id].options.length > 0;
    var progress = (state.currentStep / engine.activeQuiz.definition.steps.length) * 100;
    
    if (answered) {
      var answers = state.answers[config.id].options;
      var correctAnswers = config.options.filter(function(o) { return o.correct; }).map(function(o) { return o.value; });
      var isAnyCorrect = answers.some(function(a) { return correctAnswers.includes(a); });
      
      var cardClass = isAnyCorrect ? 'correct' : 'feedback';
      var html = '<div class="answer-card ' + cardClass + '"><h2>' + (isAnyCorrect ? 'Great thinking!' : 'Let\'s reflect...') + '</h2><div class="mt-4">';
      
      config.options.forEach(function(opt, i) {
        var wasSelected = answers.includes(opt.value);
        if (wasSelected) {
          var feedback = opt.correct ? '<span style="color: #10B981;">✓ ' + opt.feedback + '</span>' : '<span style="color: #F59E0B;">→ ' + opt.feedback + '</span>';
          html += '<p class="mb-2">' + feedback + '</p>';
        }
      });
      
      html += '</div></div><button class="btn-play mt-4" data-action="next">Continue</button>';
      return html;
    }
    
    var html = '<div class="quiz-progress-bar mb-4"><div class="quiz-progress-fill" style="width: ' + progress + '%"></div></div>';
    html += '<h2 class="mb-3">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light" style="font-size: 1.1rem; line-height: 1.6;">' + config.description + '</p>';
    html += '<form data-form><input type="hidden" name="options" value="" /><div class="scenario-options">';
    
    config.options.forEach(function(opt, i) {
      html += '<label class="scenario-option"><input type="checkbox" name="options" value="' + opt.value + '" /><span class="scenario-option-content"><span class="option-number">' + (i+1) + '</span><span>' + opt.label + '</span></span></label>';
    });
    
    html += '</div><button type="submit" class="btn-play mt-4">Submit</button></form>';
    return html;
  });

  // Breathing Minigame
  StepRenderers.register('breathing', function(engine, config, state) {
    var html = '<div class="breathing-container text-center">';
    html += '<h2 id="quiz-modal-title" class="mb-2">' + config.title + '</h2>';
    html += '<p class="mb-4 text-light">' + config.description + '</p>';
    html += '<div class="breath-circle-wrapper" style="position:relative; width:200px; height:200px; margin: 0 auto 30px auto;">';
    html += '<div id="breath-circle" class="breath-circle" style="width:100%; height:100%; border-radius:50%; background:rgba(99, 102, 241, 0.2); position:absolute; top:0; left:0; transform-origin: center;"></div>';
    html += '<div id="breath-text" class="breath-text" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); font-size:1.5rem; font-weight:bold; color:var(--color-primary); z-index:10;">Ready</div>';
    html += '</div>';
    html += '<div class="mt-4 timer-text">Cycles: <span id="b-cycles">0</span> / ' + (config.cycles || 4) + '</div>';
    html += '<button type="button" class="btn-play mt-4" data-action="startBreathing" id="b-start-btn">Start Game</button>';
    html += '<button type="button" class="btn-play mt-4" data-action="next" id="b-finish-btn" style="display:none;">Continue</button>';
    html += '</div>';
    return html;
  });

  // Completion
  StepRenderers.register('completion', function(engine, config, state) {
    var mood = state.answers['mood-selection'] && state.answers['mood-selection'].mood;
    var moodMessages = {
      great: 'It\'s wonderful to hear you\'re feeling great!',
      good: 'Good feelings matter. Hope your day stays positive!',
      okay: 'It\'s okay to feel okay. Feelings fluctuate and that\'s normal.',
      down: 'It sounds like you\'re having a tough time. Remember: this feeling won\'t last forever.',
      stressed: 'Being stressed is tough. Try to take some small breaks today.'
    };
    var message = moodMessages[mood] || 'Thank you for checking in.';
    var xp = config.xp || 10;
    
    return '<div class="text-center"><div class="success-icon">✨</div><h2>Check-in Complete</h2><p style="font-size: 1.1rem; margin: 20px 0;">' + message + '</p><div class="xp-reward">+' + xp + ' XP Earned</div><button class="btn-play mt-4" data-action="close">Finish</button></div>';
  });

  // Results
  StepRenderers.register('results', function(engine, config, state) {
    var definition = config.definition;
    var results = config.results;
    var levelEmoji = (results.level === 'high' || results.level === 'good' || results.level === 'healthy' || results.level === 'manageable') ? '🌟' : (results.level === 'medium' || results.level === 'developing' || results.level === 'learning') ? '💪' : '🤔';
    
    var html = '<div class="text-center"><div class="results-icon">' + levelEmoji + '</div><h2>Your Results</h2>';
    
    if (results.percentage !== undefined) {
      html += '<div class="results-score"><div class="score-ring"><svg viewBox="0 0 36 36" class="circular-chart"><path class="circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /><path class="circle" stroke-dasharray="' + results.percentage + ', 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" /></svg><span class="score-value">' + results.percentage + '%</span></div></div>';
    }
    
    html += '<p class="results-message">' + (results.message || (results.interpretation && results.interpretation.message) || 'Thank you for completing this assessment.') + '</p>';
    
    if (results.suggestions && results.suggestions.length > 0) {
      html += '<div class="results-suggestions"><h4>Suggestions for you:</h4><ul>';
      results.suggestions.forEach(function(s) {
        html += '<li>' + s + '</li>';
      });
      html += '</ul></div>';
    }
    
    html += '<div class="xp-reward">+' + (definition.xpReward || 0) + ' XP Earned</div>';
    html += '<div class="results-actions"><button class="btn-play" data-action="close">Finish</button></div></div>';
    
    return html;
  });

  // Quiz Results (for trivia-style)
  StepRenderers.register('quiz-results', function(engine, config, state) {
    var definition = config.definition;
    var results = config.results;
    var emoji = results.percentage >= 60 ? '🎉' : '📚';
    
    var html = '<div class="text-center"><div class="success-icon">' + emoji + '</div><h2>Quiz Complete!</h2>';
    html += '<div class="quiz-score-display"><span class="score-big">' + results.score + '</span><span class="score-divider">/</span><span class="score-total">' + results.maxScore + '</span></div>';
    html += '<p class="results-message">' + results.message + '</p>';
    
    if (results.suggestions) {
      html += '<div class="results-suggestions">';
      results.suggestions.forEach(function(s) {
        html += '<p>• ' + s + '</p>';
      });
      html += '</div>';
    }
    
    html += '<div class="xp-reward">+' + (definition.xpReward || 0) + ' XP Earned</div>';
    html += '<button class="btn-play mt-4" data-action="close">Finish</button></div>';
    
    return html;
  });

  // ============================================
  // PART 5: QUIZ DEFINITIONS
  // ============================================

  // Quiz 1: Mood Check-In
  QuizRegistry.register({
    id: 'mood-checkin',
    title: 'Daily Mood Tracker',
    description: 'A safe space to reflect on how you are feeling today.',
    category: 'mental',
    categoryLabel: 'Mental Wellness',
    duration: '4 min',
    difficulty: 'beginner',
    xpReward: 15,
    icon: '😊',
    color: '#0D9488',
    steps: [
      { id: 'intro', type: 'info', title: 'Why Track Your Mood?', content: '<strong>Did you know?</strong> Identifying your emotions is the first step to emotional regulation. <br><br>When we experience strong feelings, our amygdala (the emotional center of the brain) activates. By simply naming the emotion you are feeling, you engage your prefrontal cortex, which naturally calms down the emotional response.' },
      { id: 'mood-selection', type: 'mood-select', title: 'How are you feeling today?', description: 'There are no right or wrong answers. Just check in with yourself.', options: [{ value: 'great', label: '🌟 Great', color: '#10B981' }, { value: 'good', label: '😊 Good', color: '#22C55E' }, { value: 'okay', label: '😐 Okay', color: '#F59E0B' }, { value: 'stressed', label: '😰 Stressed', color: '#F97316' }, { value: 'down', label: '🌧️ Down', color: '#6366F1' }] },
      { id: 'physical-check', type: 'multi-select', title: 'Body Scan', description: 'Emotions often live in the body. What physical sensations are you noticing right now?', options: [{ value: 'tension', label: 'Tension in shoulders/neck' }, { value: 'heavy', label: 'Feeling heavy or tired' }, { value: 'light', label: 'Feeling light and energetic' }, { value: 'butterflies', label: 'Butterflies in stomach' }, { value: 'none', label: 'Nothing specific' }] },
      { id: 'reflection', type: 'text-input', title: 'What\'s contributing to this feeling?', description: 'Optional: Share what\'s on your mind. Writing helps clarify thoughts.', placeholder: 'Type your thoughts here...', safetyCheck: true, maxLength: 500 },
      { id: 'completion', type: 'completion', xp: 15 }
    ],
    interpretScore: function(percentage) {
      return { message: 'Thank you for checking in. Acknowledging your emotions is a healthy practice.', suggestions: ['Try taking 5 minutes each day to breathe deeply', 'Talking to a friend can help process difficult feelings'] };
    }
  });

  // Quiz 2: Burnout Check
  QuizRegistry.register({
    id: 'burnout-check',
    title: 'Burnout Self-Check',
    description: 'Recognize the signs of school or life burnout before it overwhelms you.',
    category: 'mental',
    categoryLabel: 'Mental Wellness',
    duration: '5 min',
    difficulty: 'intermediate',
    xpReward: 25,
    icon: '🔥',
    color: '#F59E0B',
    steps: [
      { id: 'info1', type: 'info', title: 'Understanding Burnout', content: 'Burnout is a state of emotional, physical, and mental exhaustion caused by excessive and prolonged stress.<br><br>Unlike normal tiredness, burnout makes you feel overwhelmed, emotionally drained, and unable to meet constant demands. It often happens when you feel like you have no control over your schoolwork, environment, or relationships.' },
      { id: 'exhaustion-level', type: 'likert', title: 'Energy & Exhaustion', description: 'In the past two weeks, how often have you felt emotionally exhausted even after sleeping?', scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] } },
      { id: 'school-engagement', type: 'likert', title: 'School Engagement', description: 'How often have you felt detached or uninterested in your schoolwork or classes?', scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] } },
      { id: 'accomplishment', type: 'likert', title: 'Sense of Accomplishment', description: 'How often do you feel like your efforts don\'t make a difference or aren\'t recognized?', scale: { min: 1, max: 5, labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'] } },
      { id: 'physical-symptoms', type: 'multi-select', title: 'Physical Signs', description: 'Burnout can manifest physically. Have you experienced any of these recently?', options: [{ value: 'headaches', label: 'Frequent headaches' }, { value: 'sleep-issues', label: 'Trouble sleeping or sleeping too much' }, { value: 'appetite', label: 'Changes in appetite' }, { value: 'stomach', label: 'Frequent stomach issues' }, { value: 'none', label: 'None of these' }] },
      { id: 'info2', type: 'info', title: 'Recovery takes time', content: 'Recovering from burnout involves resting, taking breaks, and reaching out for support. You cannot force yourself to "push through" burnout—your brain literally needs time offline to recover.' },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 20;
      var likertScore = function(val) { return parseInt(val) || 0; };
      var exhaustion = likertScore(answers['exhaustion-level']);
      var engagement = likertScore(answers['school-engagement']);
      var accomplishment = likertScore(answers['accomplishment']);
      
      score += exhaustion + engagement + accomplishment;
      var physical = answers['physical-symptoms'] || [];
      if (!physical.includes || !physical.includes('none')) { 
        score += (physical.length || 0) * 2; 
      }
      
      var percentage = Math.round((score / maxScore) * 100);
      var level = percentage < 30 ? 'manageable' : percentage < 60 ? 'moderate' : 'elevated';
      var message = percentage < 30 ? 'You seem to be managing well.' : percentage < 60 ? 'You are showing some signs of stress.' : 'You may be experiencing burnout.';
      
      var suggestions = [];
      if (exhaustion >= 4) {
        suggestions.push("Because your physical exhaustion is high, prioritize getting 8 hours of sleep and taking regular breaks. Your body needs rest.");
      }
      if (engagement >= 4) {
        suggestions.push("Your detachment from school/work is notable. Try studying in shorter bursts (like the Pomodoro technique) to avoid feeling overwhelmed.");
      }
      if (accomplishment >= 4) {
        suggestions.push("It's common in burnout to feel like your efforts don't matter. Try setting very small, easily achievable 'micro-goals' today to rebuild momentum.");
      }
      if (physical.length > 0 && !physical.includes('none')) {
        suggestions.push("Your body is showing physical signs of stress. Please listen to these signals—hydration, nutrition, and screen-free time are vital right now.");
      }
      if (suggestions.length === 0) {
        suggestions.push("You are managing your energy well! Keep prioritizing your mental health and maintaining your current boundaries.");
      }

      return { score: score, maxScore: maxScore, percentage: percentage, level: level, message: message, suggestions: suggestions };
    }
  });

  // Quiz 3: Anxiety Check
  QuizRegistry.register({
    id: 'anxiety-check',
    title: 'Anxiety Reflection',
    description: 'Understand and manage feelings of worry or nervousness.',
    category: 'mental',
    categoryLabel: 'Mental Wellness',
    duration: '4 min',
    difficulty: 'intermediate',
    xpReward: 20,
    icon: '🧠',
    color: '#8B5CF6',
    steps: [
      { id: 'worry-frequency', type: 'likert', title: 'Worry Patterns', description: 'How often do you feel worried about things that might happen in the future?', scale: { min: 1, max: 5, labels: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'All the time'] } },
      { id: 'physical-anxiety', type: 'multi-select', title: 'Body Signals', description: 'When you feel anxious, do you notice any of these in your body?', options: [{ value: 'racing-heart', label: 'Heart racing or pounding' }, { value: 'breathing', label: 'Quick or shallow breathing' }, { value: 'stomach', label: 'Tight stomach or nausea' }, { value: 'muscles', label: 'Tense muscles' }, { value: 'trouble-focusing', label: 'Difficulty concentrating' }, { value: 'none', label: 'None of these' }] },
      { id: 'coping-strategies', type: 'checkbox', title: 'What helps you calm down?', description: 'Select the strategies that work for you', options: [{ value: 'breathing', label: 'Deep breathing exercises' }, { value: 'talking', label: 'Talking to someone' }, { value: 'exercise', label: 'Physical activity or walking' }, { value: 'music', label: 'Listening to music' }, { value: 'writing', label: 'Writing or journaling' }, { value: 'distraction', label: 'Distracting myself' }, { value: 'none', label: 'Nothing works yet' }] },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 12;
      var worryScore = parseInt(answers['worry-frequency']) || 0;
      score += worryScore;
      
      var physical = answers['physical-anxiety'] || [];
      if (!physical.includes || !physical.includes('none')) { score += physical.length || 0; }
      
      var percentage = Math.round((score / maxScore) * 100);
      var level = percentage < 30 ? 'manageable' : percentage < 60 ? 'moderate' : 'elevated';
      var message = percentage < 30 ? 'Your anxiety levels seem manageable.' : percentage < 60 ? 'You are experiencing some anxiety.' : 'Your anxiety seems significant.';
      
      var suggestions = [];
      if (worryScore >= 4) {
        suggestions.push("Since you worry often, try scheduling 'worry time' (15 minutes a day) to process these thoughts, rather than letting them take over your whole day.");
      }
      if (physical.includes('breathing') || physical.includes('racing-heart')) {
        suggestions.push("When your heart races or breathing gets shallow, try the 4-7-8 breathing technique to force your nervous system to calm down.");
      }
      if (physical.includes('stomach') || physical.includes('muscles')) {
        suggestions.push("You hold tension in your body. Try a Progressive Muscle Relaxation (PMR) body scan before bed to release the tightness.");
      }
      
      var coping = answers['coping-strategies'] || [];
      if (coping.includes('none')) {
        suggestions.push("Since nothing seems to help calm you down yet, please consider speaking with a trusted counselor who can teach you specialized grounding techniques.");
      } else if (!coping.includes('talking') && coping.length > 0) {
        suggestions.push("You have some good independent coping strategies, but don't forget that simply talking to someone you trust is incredibly powerful for anxiety.");
      }
      
      if (suggestions.length === 0) {
        suggestions.push("You are using excellent emotional regulation skills. Keep listening to your body!");
      }

      return { score: score, maxScore: maxScore, percentage: percentage, level: level, message: message, suggestions: suggestions };
    }
  });

  // Quiz 4: STI Awareness
  QuizRegistry.register({
    id: 'sti-awareness',
    title: 'STI Awareness Quiz',
    description: 'Test your knowledge about sexually transmitted infections.',
    category: 'reproductive',
    categoryLabel: 'Reproductive Health',
    duration: '7 min',
    difficulty: 'beginner',
    xpReward: 30,
    icon: '🛡️',
    color: '#F97066',
    steps: [
      { id: 'info1', type: 'info', title: 'Why Does This Matter?', content: 'Sexually Transmitted Infections (STIs) are extremely common. In fact, the WHO states that more than 1 million STIs are acquired every day worldwide.<br><br>The biggest misconception? That you can "tell" if someone has an STI. The vast majority of STIs are <strong>asymptomatic</strong>, meaning the person feels perfectly fine and shows absolutely no signs.' },
      { id: 'q1', type: 'true-false', title: 'Transmission Truth', description: 'You can tell if someone has an STI just by looking at them.', correctAnswer: false, explanation: 'Many STIs have no visible symptoms at all. The only way to know for sure is through testing.' },
      { id: 'info2', type: 'info', title: 'Dual Protection', content: 'When it comes to sexual health, using a condom is one of the most effective ways to protect yourself against STIs and HIV.<br><br>Contraceptive pills and implants are great for preventing pregnancy, but they offer <strong>zero protection</strong> against STIs. This is why "Dual Protection" (Condom + Contraceptive) is the gold standard recommended by the WHO.' },
      { id: 'q2', type: 'true-false', title: 'Protection Facts', description: 'Using a condom correctly every time reduces the risk of most STIs.', correctAnswer: true, explanation: 'Condoms are highly effective at preventing many STIs when used consistently and correctly.' },
      { id: 'q3', type: 'multiple-choice', title: 'Testing Knowledge', description: 'Where can someone get STI testing in Rwanda?', options: [{ value: 'health-center', label: 'Health centers and hospitals' }, { value: 'pharmacy', label: 'Pharmacies (some offer testing)' }, { value: 'youth-clinic', label: 'Youth-friendly health services' }, { value: 'all', label: 'All of the above' }], correctAnswer: 'all', explanation: 'In Rwanda, testing is available at public health centers, some pharmacies, and youth-friendly clinics. Many services are free or low-cost.' },
      { id: 'q4', type: 'true-false', title: 'Treatment Facts', description: 'Some STIs can be cured with medication, while others can only be managed.', correctAnswer: true, explanation: 'Bacterial STIs like chlamydia and gonorrhea can be cured with antibiotics. Viral STIs like HIV and herpes can be managed but not cured.' },
      { id: 'results', type: 'quiz-results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var total = 4;
      Object.entries(answers).forEach(function(entry) {
        var qId = entry[0];
        var answer = entry[1];
        var step = QuizRegistry.get('sti-awareness').steps.find(function(s) { return s.id === qId; });
        if (step && step.correctAnswer !== undefined) {
          if (step.type === 'true-false') { if ((answer === 'true') === step.correctAnswer) score++; }
          else if (step.type === 'multiple-choice') { if (answer === step.correctAnswer) score++; }
        }
      });
      var percentage = Math.round((score / total) * 100);
      var message = percentage >= 80 ? 'Excellent knowledge!' : 'Great opportunity to learn more.';
      
      var suggestions = [];
      if (answers['q1'] !== 'false') {
        suggestions.push("Review: You cannot tell if someone has an STI just by looking at them. The vast majority of STIs are completely asymptomatic.");
      }
      if (answers['q2'] !== 'true') {
        suggestions.push("Review: Condoms are essential for 'Dual Protection' against STIs, even if you are already using other contraceptives like pills or implants.");
      }
      if (answers['q3'] !== 'all') {
        suggestions.push("Review: STI testing in Rwanda is highly accessible. You can get tested at public health centers, youth clinics, and some pharmacies.");
      }
      if (answers['q4'] !== 'true') {
        suggestions.push("Review: Not all STIs are curable. Viral STIs (like HIV and herpes) can only be managed with medication, while bacterial ones (like chlamydia) are cured with antibiotics.");
      }
      
      if (suggestions.length === 0) {
        suggestions.push("Perfect score! You have an excellent grasp of sexual health facts. Share this accurate information with your peers!");
      }

      return { score: score, maxScore: total, percentage: percentage, message: message, suggestions: suggestions };
    }
  });

  // Quiz 5: Consent Education
  QuizRegistry.register({
    id: 'consent-education',
    title: 'Understanding Consent',
    description: 'Learn about healthy boundaries and consent in relationships.',
    category: 'reproductive',
    categoryLabel: 'Reproductive Health',
    duration: '6 min',
    difficulty: 'beginner',
    xpReward: 25,
    icon: '🤝',
    color: '#EC4899',
    steps: [
      { id: 'consent-definition', type: 'scenario', title: 'What is Consent?', description: 'Sarah and James have been dating for a month. One evening, Sarah agrees to share her location on her phone. A week later, James asks again to check it. What should happen?', options: [{ value: 'always-share', label: 'Sarah should always share because they are dating', correct: false, feedback: 'Being in a relationship doesn\'t mean giving up privacy. Every request is a new decision.' }, { value: 'say-no', label: 'Sarah can say no if she\'s not comfortable', correct: true, feedback: 'Correct! Consent is ongoing - someone can change their mind at any time.' }, { value: 'ask-once', label: 'James should only ask once and accept the answer', correct: true, feedback: 'Exactly! A respectful partner accepts the answer without pressure.' }] },
      { id: 'enthusiastic-consent', type: 'likert', title: 'Recognizing Consent', description: 'How would you describe enthusiastic consent?', scale: { min: 1, max: 4, labels: ['Silence or just going along', 'Saying "maybe"', 'Saying "yes" clearly', 'An enthusiastic "yes!" with clear interest'] } },
      { id: 'coercion-recognition', type: 'multi-select', title: 'Warning Signs', description: 'Which of these might be signs of coercion or pressure?', options: [{ value: 'guilt-tripping', label: 'Using guilt to get what they want' }, { value: 'threats', label: 'Threatening to end the relationship' }, { value: 'drunk', label: 'Taking advantage when someone is drunk' }, { value: 'compliments', label: 'Giving compliments' }, { value: 'pressure', label: 'Repeatedly asking after "no"' }, { value: 'none', label: 'None of these are concerning' }] },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 10;
      var scenarioAnswers = answers['consent-definition'];
      if (scenarioAnswers && Array.isArray(scenarioAnswers)) { score += scenarioAnswers.filter(function(a) { return a === 'say-no' || a === 'ask-once'; }).length; }
      var consentScore = parseInt(answers['enthusiastic-consent']) || 0;
      if (consentScore >= 3) score += 3; else if (consentScore === 2) score += 1;
      var coercion = answers['coercion-recognition'] || [];
      var concerning = ['guilt-tripping', 'threats', 'drunk', 'pressure'];
      var correctSelections = concerning.filter(function(c) { return coercion.indexOf(c) !== -1; });
      score += correctSelections.length;
      var percentage = Math.round((score / maxScore) * 100);
      return { score: score, maxScore: maxScore, percentage: percentage, level: percentage >= 70 ? 'good' : percentage >= 40 ? 'developing' : 'learning', message: 'Understanding consent is about respecting yourself and others.', suggestions: ['Consent is "yes" - not the absence of "no"', 'Everyone has the right to change their mind', 'A healthy relationship respects boundaries'] };
    }
  });

  // Quiz 6: Myth vs Fact
  QuizRegistry.register({
    id: 'myth-fact',
    title: 'Myth vs. Fact Challenge',
    description: 'Test your knowledge about common myths and facts about health.',
    category: 'reproductive',
    categoryLabel: 'Reproductive Health',
    duration: '5 min',
    difficulty: 'beginner',
    xpReward: 20,
    icon: '🎯',
    color: '#F97316',
    steps: [
      { id: 'myth1', type: 'true-false', title: 'Puberty Myth', description: 'Acne means you are not washing your face enough.', correctAnswer: false, explanation: 'Myth! Acne during puberty is caused by hormonal changes that increase oil production, not by poor hygiene.' },
      { id: 'myth2', type: 'true-false', title: 'Timeline Fact', description: 'Everyone goes through puberty at different times.', correctAnswer: true, explanation: 'Fact! Puberty can start anywhere between ages 8 and 14. Everyone\'s body runs on its own healthy timeline.' },
      { id: 'myth3', type: 'true-false', title: 'Contraception Myth', description: 'The pull-out method is as effective as condoms at preventing pregnancy.', correctAnswer: false, explanation: 'Myth! Pull-out is not reliable. Condoms (used correctly) are much more effective at preventing pregnancy.' },
      { id: 'myth4', type: 'true-false', title: 'STI Fact', description: 'Two condoms are better than one at preventing STIs.', correctAnswer: false, explanation: 'Myth! Using two condoms can actually cause friction and increase the chance of breaking. One condom is the way to go!' },
      { id: 'results', type: 'quiz-results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var total = 4;
      Object.entries(answers).forEach(function(entry) {
        var qId = entry[0];
        var answer = entry[1];
        var step = QuizRegistry.get('myth-fact').steps.find(function(s) { return s.id === qId; });
        if (step && step.correctAnswer !== undefined) { if ((answer === 'true') === step.correctAnswer) score++; }
      });
      var percentage = Math.round((score / total) * 100);
      var message = score >= 3 ? 'Great job separating fact from fiction!' : 'Keep learning - accurate information protects your health.';
      return { score: score, maxScore: total, percentage: percentage, message: message, suggestions: ['Always verify health information with trusted sources', 'Talk to a health provider for accurate answers', 'Share correct information with friends'] };
    }
  });

  // Quiz 7: Relationship Check
  QuizRegistry.register({
    id: 'relationship-check',
    title: 'Healthy Relationship Check',
    description: 'Learn to recognize healthy and unhealthy relationship patterns.',
    category: 'relationship',
    categoryLabel: 'Relationship Safety',
    duration: '6 min',
    difficulty: 'intermediate',
    xpReward: 25,
    icon: '💝',
    color: '#E11D48',
    steps: [
      { id: 'control-patterns', type: 'scenario', title: 'Digital Boundaries', description: 'A partner constantly asks for your social media passwords "because they trust you." What do you do?', options: [{ value: 'share-password', label: 'Share the password - it shows you trust them', correct: false, feedback: 'Even in trusting relationships, passwords are personal. Healthy partners respect digital privacy.' }, { value: 'decline-politely', label: 'Politely decline and explain it\'s a personal boundary', correct: true, feedback: 'Correct! Healthy relationships are built on respect for each other\'s privacy.' }, { value: 'get-angry', label: 'Get angry and refuse', correct: false, feedback: 'While it\'s okay to assert boundaries, communicating calmly is healthier.' }] },
      { id: 'pressure-scenarios', type: 'scenario', title: 'Handling Pressure', description: 'Your partner pressures you to do something you\'re not comfortable with, saying "if you loved me you would." What\'s the healthy response?', options: [{ value: 'give-in', label: 'Do it to keep the peace', correct: false, feedback: 'Your comfort matters more than pressure. True love respects boundaries.' }, { value: 'clear-no', label: 'Communicate your boundary clearly and say no', correct: true, feedback: 'Exactly! A partner who respects you will always accept your "no" without pressure.' }, { value: 'ignore', label: 'Ignore them and avoid the topic', correct: false, feedback: 'Open communication is key. Avoiding important topics isn\'t healthy.' }] },
      { id: 'red-flags', type: 'multi-select', title: 'Warning Signs', description: 'Which are potential red flags in a relationship?', options: [{ value: 'isolation', label: 'Trying to isolate you from friends/family' }, { value: 'jealousy', label: 'Extreme jealousy without reason' }, { value: 'criticism', label: 'Constant criticism or put-downs' }, { value: 'checking-phone', label: 'Checking your phone without permission' }, { value: 'supportive', label: 'Supporting your goals and dreams' }, { value: 'good-communication', label: 'Good communication and honesty' }] },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 10;
      var scenarios = ['control-patterns', 'pressure-scenarios'];
      scenarios.forEach(function(id) {
        var answer = answers[id];
        if (answer && Array.isArray(answer)) { score += answer.filter(function(a) { return a === 'decline-politely' || a === 'clear-no'; }).length * 2; }
      });
      var redFlags = answers['red-flags'] || [];
      var correctFlags = ['isolation', 'jealousy', 'criticism', 'checking-phone'].filter(function(f) { return redFlags.indexOf(f) !== -1; });
      score += correctFlags.length;
      var percentage = Math.round((score / maxScore) * 100);
      var level, message;
      if (percentage >= 70) { level = 'healthy'; message = 'Great awareness of healthy relationship patterns!'; }
      else if (percentage >= 40) { level = 'learning'; message = 'You\'re developing important relationship skills.'; }
      else { level = 'needs-attention'; message = 'Learning about healthy relationships is always valuable.'; }
      return { score: score, maxScore: maxScore, percentage: percentage, level: level, message: message, suggestions: ['Healthy relationships include respect, trust, and communication', 'You deserve to be with someone who values your boundaries', 'It\'s okay to end relationships that don\'t serve you'] };
    }
  });

  // Quiz 8: Online Safety
  QuizRegistry.register({
    id: 'online-safety',
    title: 'Online Safety Awareness',
    description: 'Protect yourself in the digital world.',
    category: 'lifestyle',
    categoryLabel: 'Youth Lifestyle & Safety',
    duration: '5 min',
    difficulty: 'beginner',
    xpReward: 20,
    icon: '📱',
    color: '#06B6D4',
    steps: [
      { id: 'privacy-basics', type: 'scenario', title: 'Privacy Protection', description: 'Someone you don\'t know well asks for your phone number online. What do you do?', options: [{ value: 'share-it', label: 'Share it - they seem nice', correct: false, feedback: 'Be careful! Sharing personal information with strangers can be risky.' }, { value: 'decline', label: 'Politely decline', correct: true, feedback: 'Correct! Protecting your personal information is smart online safety.' }, { value: 'ask-friends', label: 'Ask friends if it\'s okay first', correct: false, feedback: 'Your safety is your decision. Trust your instincts over others\' opinions.' }] },
      { id: 'digital-footprint', type: 'true-false', title: 'Digital Memory', description: 'Anything you post online can be there forever, even if you delete it.', correctAnswer: true, explanation: 'True! Screenshots, archives, and cached versions can preserve content. Think before you post.' },
      { id: 'social-media', type: 'multi-select', title: 'Safe Social Media', description: 'Which practices help keep you safe on social media?', options: [{ value: 'private-accounts', label: 'Using private account settings' }, { value: 'accept-all', label: 'Accepting all friend requests' }, { value: 'location-off', label: 'Turning off location sharing' }, { value: 'share-passwords', label: 'Sharing passwords with close friends' }, { value: 'think-before', label: 'Thinking before posting' }] },
      { id: 'results', type: 'quiz-results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 8;
      var scenario = answers['privacy-basics'];
      if (scenario && Array.isArray(scenario) && scenario.indexOf('decline') !== -1) score += 3;
      var footprint = answers['digital-footprint'];
      if ((footprint === 'true') === true) score += 2;
      var social = answers['social-media'] || [];
      var safe = ['private-accounts', 'location-off', 'think-before'].filter(function(s) { return social.indexOf(s) !== -1; });
      score += safe.length;
      var percentage = Math.round((score / maxScore) * 100);
      return { score: score, maxScore: maxScore, percentage: percentage, message: percentage >= 60 ? 'Great digital safety awareness!' : 'Keep learning to protect yourself online.', suggestions: ['Your digital footprint is permanent', 'Only share with people you trust in real life', 'Report anything that makes you uncomfortable'] };
    }
  });

  // Quiz 9: Peer Pressure
  QuizRegistry.register({
    id: 'peer-pressure',
    title: 'Peer Pressure Reflection',
    description: 'Navigate challenging social situations with confidence.',
    category: 'lifestyle',
    categoryLabel: 'Youth Lifestyle & Safety',
    duration: '4 min',
    difficulty: 'beginner',
    xpReward: 15,
    icon: '👥',
    color: '#8B5CF6',
    steps: [
      { id: 'pressure-scenarios', type: 'scenario', title: 'Standing Your Ground', description: 'Your friends are doing something you\'re not comfortable with, and they say "Come on, don\'t be lame." What do you do?', options: [{ value: 'join-in', label: 'Join in to not feel left out', correct: false, feedback: 'Your values matter more than peer approval. Real friends respect your choices.' }, { value: 'speak-up', label: 'Speak up and say you\'re not comfortable', correct: true, feedback: 'Exactly! Being true to yourself takes courage and builds respect.' }, { value: 'leave', label: 'Leave the situation quietly', correct: true, feedback: 'It\'s okay to remove yourself from uncomfortable situations.' }, { value: 'lie', label: 'Make up an excuse', correct: false, feedback: 'While avoiding conflict, being honest is better for relationships.' }] },
      { id: 'assertiveness', type: 'likert', title: 'Speaking Up', description: 'How comfortable are you saying "no" when you don\'t want to do something?', scale: { min: 1, max: 5, labels: ['Very uncomfortable', 'Somewhat uncomfortable', 'Neutral', 'Somewhat comfortable', 'Very comfortable'] } },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var score = 0;
      var maxScore = 8;
      var scenario = answers['pressure-scenarios'];
      if (scenario && Array.isArray(scenario)) { score += scenario.filter(function(s) { return s === 'speak-up' || s === 'leave'; }).length * 2; }
      var comfort = parseInt(answers['assertiveness']) || 0;
      score += comfort;
      var percentage = Math.round((score / maxScore) * 100);
      return { score: score, maxScore: maxScore, percentage: percentage, message: 'Saying no is a skill that gets easier with practice.', suggestions: ['Practice confident "no" phrases in the mirror', 'Real friends respect your boundaries', 'Your choices matter more than others\' opinions'] };
    }
  });

  // Quiz 10: Stress Check-In
  QuizRegistry.register({
    id: 'stress-check',
    title: 'Stress Check-In',
    description: 'A quick check on your stress levels and coping strategies.',
    category: 'mental',
    categoryLabel: 'Mental Wellness',
    duration: '3 min',
    difficulty: 'beginner',
    xpReward: 15,
    icon: '😤',
    color: '#EF4444',
    steps: [
      { id: 'stress-level', type: 'likert', title: 'Current Stress Level', description: 'In the past week, how stressed have you felt overall?', scale: { min: 1, max: 5, labels: ['Not at all stressed', 'A little stressed', 'Moderately stressed', 'Very stressed', 'Extremely stressed'] } },
      { id: 'stress-sources', type: 'multi-select', title: 'Stress Sources', description: 'What has been causing you stress?', options: [{ value: 'school', label: 'School or studies' }, { value: 'family', label: 'Family issues' }, { value: 'relationships', label: 'Friends or relationships' }, { value: 'future', label: 'Worrying about the future' }, { value: 'money', label: 'Money or basics' }, { value: 'health', label: 'Health concerns' }, { value: 'other', label: 'Other' }] },
      { id: 'coping-check', type: 'checkbox', title: 'Coping Strategies', description: 'What do you do to manage stress?', options: [{ value: 'exercise', label: 'Exercise or physical activity' }, { value: 'sleep', label: 'Rest and sleep' }, { value: 'friends', label: 'Talk to friends/family' }, { value: 'hobbies', label: 'Do hobbies I enjoy' }, { value: 'prayer', label: 'Prayer or spiritual practice' }, { value: 'music', label: 'Listen to music' }, { value: 'none', label: 'I don\'t have healthy ways yet' }] },
      { id: 'results', type: 'results' }
    ],
    scorer: function(answers) {
      var stressLevel = parseInt(answers['stress-level']) || 1;
      var coping = answers['coping-check'] || [];
      var hasHealthy = coping.some(function(c) { return c !== 'none' && c !== 'other'; });
      var score = 0;
      var maxScore = 10;
      if (stressLevel <= 2) score += 3; else if (stressLevel <= 3) score += 2; else score += 1;
      if (hasHealthy) score += 4; else if (coping.indexOf && coping.indexOf('none') !== -1) score += 1;
      var percentage = Math.round((score / maxScore) * 100);
      return { score: score, maxScore: maxScore, percentage: percentage, level: percentage >= 60 ? 'manageable' : 'needs-attention', message: hasHealthy ? 'Great job using healthy coping strategies!' : 'Building healthy coping skills takes time. Start with one small thing.', suggestions: hasHealthy ? ['Keep prioritizing your healthy habits', 'Share your coping strategies with friends'] : ['Try one new activity like walking or talking to someone', 'It\'s okay to ask for help with stress', 'Basic self-care (sleep, food, rest) makes a big difference'] };
    }
  });

  // Quiz 11: Box Breathing
  QuizRegistry.register({
    id: 'box-breathing',
    title: 'Box Breathing Minigame',
    description: 'A simple breathing game of Inhale, Hold, and Exhale.',
    category: 'stress',
    categoryLabel: 'Stress Relief',
    duration: '2 min',
    difficulty: 'beginner',
    xpReward: 15,
    icon: '🧘',
    color: '#6366F1',
    steps: [
      { 
        id: 'breathe', 
        type: 'breathing', 
        title: 'Box Breathing', 
        description: 'Follow the circle. Inhale, Hold, Exhale, Hold.',
        cycles: 4,
        actions: {
          startBreathing: function(engine, btn) {
            btn.style.display = 'none';
            var container = document.getElementById('quiz-modal-content');
            var circle = container.querySelector('#breath-circle');
            var text = container.querySelector('#breath-text');
            var cycleEl = container.querySelector('#b-cycles');
            var cycles = 4;
            var currentCycle = 0;
            
            var tl = gsap.timeline({ 
              repeat: cycles - 1,
              onRepeat: function() {
                currentCycle++;
                cycleEl.innerText = currentCycle;
              },
              onComplete: function() {
                currentCycle++;
                cycleEl.innerText = currentCycle;
                text.innerText = "Done";
                container.querySelector('#b-finish-btn').style.display = 'inline-block';
              }
            });
            
            tl.to(circle, { scale: 1.5, duration: 4, ease: "sine.inOut", onStart: function() { text.innerText = "Inhale..."; } })
              .to(circle, { scale: 1.5, duration: 4, onStart: function() { text.innerText = "Hold..."; } })
              .to(circle, { scale: 1, duration: 4, ease: "sine.inOut", onStart: function() { text.innerText = "Exhale..."; } })
              .to(circle, { scale: 1, duration: 4, onStart: function() { text.innerText = "Hold..."; } });
          }
        }
      },
      { id: 'completion', type: 'completion', xp: 15 }
    ]
  });

  // ============================================
  // PART 6: PUBLIC API
  // ============================================

  var QuizLauncher = {
    engine: null,
    initialized: false,

    init: function(options) {
      if (this.initialized) return;
      this.engine = new QuizEngine(Object.assign({
        containerSelector: '#quiz-modal-content',
        overlayId: 'quiz-engine-overlay',
        xpEnabled: true,
        saveProgress: true,
        analyticsEnabled: true
      }, options));
      this.initialized = true;
    },

    launch: function(quizId, params) {
      if (!this.initialized) this.init();
      this.engine.launchQuiz(quizId, params);
    },

    getQuizzes: function() {
      if (!this.initialized) this.init();
      return this.engine.getQuizList();
    },

    getQuiz: function(quizId) {
      return QuizRegistry.get(quizId);
    },

    getProgress: function(quizId) {
      if (!this.initialized) return null;
      return this.engine.getProgress(quizId);
    }
  };

  var QuickLaunch = {
    moodCheckIn: function() { QuizLauncher.launch('mood-checkin'); },
    burnoutCheck: function() { QuizLauncher.launch('burnout-check'); },
    anxietyCheck: function() { QuizLauncher.launch('anxiety-check'); },
    stiAwareness: function() { QuizLauncher.launch('sti-awareness'); },
    consentEducation: function() { QuizLauncher.launch('consent-education'); },
    mythFact: function() { QuizLauncher.launch('myth-fact'); },
    relationshipCheck: function() { QuizLauncher.launch('relationship-check'); },
    onlineSafety: function() { QuizLauncher.launch('online-safety'); },
    peerPressure: function() { QuizLauncher.launch('peer-pressure'); },
    stressCheck: function() { QuizLauncher.launch('stress-check'); },
    boxBreathing: function() { QuizLauncher.launch('box-breathing'); }
  };

  // Expose to global
  global.QuizEngine = QuizEngine;
  global.QuizModal = QuizModal;
  global.ProgressTracker = ProgressTracker;
  global.SafetyInterceptor = SafetyInterceptor;
  global.QuizAnalytics = QuizAnalytics;
  global.DefaultScorer = DefaultScorer;
  global.QuizRegistry = QuizRegistry;
  global.StepRenderers = StepRenderers;
  global.QuizLauncher = QuizLauncher;
  global.QuickLaunch = QuickLaunch;

})(window);

console.log('YouthCare Connect Quiz System v2.0 loaded');