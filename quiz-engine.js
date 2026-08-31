/**
 * YouthCare Connect - Playable Wellness Quiz Engine
 * High-performance Vanilla JS component system.
 */

const QuizEngine = (() => {
  // Global State
  let xp = parseInt(localStorage.getItem('ycc_xp')) || 450;
  let streak = parseInt(localStorage.getItem('ycc_streak')) || 12;

  // Trigger words for the Safety Interceptor
  const TRIGGER_WORDS = ["suicide", "kill myself", "harm", "abuse", "cutting", "end it all"];

  // ---------------------------------------------------------
  // CORE UI MANAGER
  // ---------------------------------------------------------
  
  function openModal(htmlContent, onMount) {
    let overlay = document.getElementById('quiz-engine-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'quiz-engine-overlay';
      overlay.className = 'quiz-overlay';
      document.body.appendChild(overlay);
    }
    
    overlay.innerHTML = `
      <div class="quiz-modal">
        <button class="quiz-close-btn" id="qc-close">&times;</button>
        <div id="quiz-modal-content" class="quiz-modal-content">
          ${htmlContent}
        </div>
        <div class="quiz-disclaimer">
          YouthCare Connect provides educational wellness support and does not replace emergency or professional medical care.
        </div>
      </div>
    `;
    
    // Add animations
    gsap.fromTo('.quiz-modal', { y: 100, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    
    document.getElementById('qc-close').addEventListener('click', closeModal);
    
    if (onMount) onMount(document.getElementById('quiz-modal-content'));
  }

  function closeModal() {
    const overlay = document.getElementById('quiz-engine-overlay');
    if (overlay) {
      gsap.to('.quiz-modal', { y: 100, opacity: 0, duration: 0.3, onComplete: () => {
        overlay.remove();
      }});
    }
  }

  function addXP(amount) {
    xp += amount;
    localStorage.setItem('ycc_xp', xp);
    const counter = document.getElementById('xpCounter');
    if (counter) counter.innerText = xp;
    // Trigger Confetti
    if (window.triggerConfetti) {
      window.triggerConfetti(window.innerWidth / 2, window.innerHeight / 2);
    }
  }

  // ---------------------------------------------------------
  // SAFETY INTERCEPTOR
  // ---------------------------------------------------------

  function checkSafety(text) {
    const lowerText = text.toLowerCase();
    for (let word of TRIGGER_WORDS) {
      if (lowerText.includes(word)) {
        renderSafetyScreen();
        return true; // Intercepted
      }
    }
    return false;
  }

  function renderSafetyScreen() {
    const html = `
      <div class="safe-screen text-center">
        <div class="safe-icon">🛡️</div>
        <h2>You are not alone.</h2>
        <p>It sounds like you might be going through a really difficult time. Your safety and wellbeing are incredibly important.</p>
        <div class="safe-card">
          <p><strong>YouthCare Connect is an educational platform and cannot provide emergency support.</strong></p>
          <p>Please reach out immediately to someone who can help keep you safe:</p>
          <ul class="safe-list">
            <li>📞 Emergency: <strong>112</strong></li>
            <li>💬 Local Crisis Hotline: <strong>+250 791 844 573</strong></li>
            <li>🧑‍⚕️ Talk to a trusted teacher, counselor, or family member.</li>
          </ul>
        </div>
        <button class="btn-play mt-4" id="qc-safe-close">I understand, exit activity</button>
      </div>
    `;
    openModal(html, (container) => {
      container.querySelector('#qc-safe-close').addEventListener('click', closeModal);
    });
  }

  // ---------------------------------------------------------
  // COMPONENT 1: MENTAL WELLNESS CHECK-IN
  // ---------------------------------------------------------
  
  function launchMentalCheckIn() {
    let state = { step: 0, mood: null, reflection: "" };

    function render(container) {
      if (state.step === 0) {
        container.innerHTML = `
          <h2>Daily Mood Tracker</h2>
          <p class="mb-4">How are you feeling today? There are no right or wrong answers.</p>
          <div class="mood-grid">
            <button class="mood-btn" data-mood="Great">🌟 Great</button>
            <button class="mood-btn" data-mood="Good">😊 Good</button>
            <button class="mood-btn" data-mood="Okay">😐 Okay</button>
            <button class="mood-btn" data-mood="Stressed">😰 Stressed</button>
            <button class="mood-btn" data-mood="Down">🌧️ Down</button>
          </div>
        `;
        container.querySelectorAll('.mood-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            state.mood = e.target.getAttribute('data-mood');
            state.step = 1;
            render(container);
          });
        });
      } else if (state.step === 1) {
        container.innerHTML = `
          <h2>Reflect</h2>
          <p class="mb-4">You selected <strong>${state.mood}</strong>. What's one thing contributing to this feeling? (Optional)</p>
          <textarea id="mood-reflection" placeholder="Type your thoughts here..."></textarea>
          <button class="btn-play mt-4" id="mood-next">Continue</button>
        `;
        container.querySelector('#mood-next').addEventListener('click', () => {
          const text = container.querySelector('#mood-reflection').value;
          if (checkSafety(text)) return;
          state.reflection = text;
          state.step = 2;
          render(container);
        });
      } else if (state.step === 2) {
        let advice = "Thank you for checking in. Acknowledging your emotions is a great first step to wellbeing.";
        if (state.mood === "Stressed" || state.mood === "Down") {
          advice = "It sounds like you're carrying a lot right now. Remember to be gentle with yourself. Taking 5 minutes to breathe or talk to a friend can make a big difference.";
        }
        container.innerHTML = `
          <div class="text-center">
            <div class="success-icon">✨</div>
            <h2>Check-in Complete</h2>
            <p>${advice}</p>
            <div class="xp-reward">+10 XP Earned</div>
            <button class="btn-play mt-4" id="mood-finish">Finish</button>
          </div>
        `;
        container.querySelector('#mood-finish').addEventListener('click', () => {
          addXP(10);
          closeModal();
        });
      }
    }
    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 2: GUIDED BREATHING
  // ---------------------------------------------------------
  
  function launchBreathing() {
    let interval;
    let phase = "Inhale";
    let timeLeft = 60; // 1 minute for demo purposes

    function render(container) {
      container.innerHTML = `
        <div class="breathing-container text-center">
          <h2 class="mb-2">Box Breathing</h2>
          <p class="mb-4 text-light">Follow the circle to calm your nervous system.</p>
          
          <div class="breath-circle-wrapper">
            <div id="breath-circle" class="breath-circle"></div>
            <div id="breath-text" class="breath-text">${phase}</div>
          </div>
          
          <div class="mt-4 timer-text">Time remaining: <span id="b-timer">${timeLeft}</span>s</div>
          <button class="btn-outline mt-4" id="b-stop">End Early</button>
        </div>
      `;

      const circle = container.querySelector('#breath-circle');
      const text = container.querySelector('#breath-text');
      const timerEl = container.querySelector('#b-timer');

      // 4-4-4-4 Box Breathing Animation using GSAP
      const tl = gsap.timeline({ repeat: -1 });
      
      tl.to(circle, { scale: 1.5, duration: 4, ease: "sine.inOut", onStart: () => text.innerText = "Inhale..." })
        .to(circle, { scale: 1.5, duration: 4, onStart: () => text.innerText = "Hold..." })
        .to(circle, { scale: 1, duration: 4, ease: "sine.inOut", onStart: () => text.innerText = "Exhale..." })
        .to(circle, { scale: 1, duration: 4, onStart: () => text.innerText = "Hold..." });

      interval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
          clearInterval(interval);
          tl.kill();
          renderSuccess(container);
        }
      }, 1000);

      container.querySelector('#b-stop').addEventListener('click', () => {
        clearInterval(interval);
        tl.kill();
        closeModal();
      });
    }

    function renderSuccess(container) {
      container.innerHTML = `
        <div class="text-center">
          <div class="success-icon">🌿</div>
          <h2>Great Job!</h2>
          <p>You've completed your breathing exercise. Notice how your body feels.</p>
          <div class="xp-reward">+15 XP Earned</div>
          <button class="btn-play mt-4" id="b-finish">Finish</button>
        </div>
      `;
      container.querySelector('#b-finish').addEventListener('click', () => {
        addXP(15);
        closeModal();
      });
    }

    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 3: MYTH VS FACT (SEXUAL HEALTH)
  // ---------------------------------------------------------
  
  const pubertyData = [
    {
      statement: "Acne means you are not washing your face enough.",
      isFact: false,
      explanation: "Myth! Acne during puberty is primarily caused by hormonal changes that increase oil production, not by poor hygiene. Washing twice a day with a gentle cleanser is enough."
    },
    {
      statement: "Everyone goes through puberty at different times.",
      isFact: true,
      explanation: "Fact! Puberty can start anywhere between ages 8 and 14. Everyone's body runs on its own unique, healthy timeline."
    },
    {
      statement: "You can tell if someone has an STI just by looking at them.",
      isFact: false,
      explanation: "Myth! Many STIs have no visible symptoms at all. The only way to know for sure is through medical testing."
    }
  ];

  function launchMythVsFact() {
    let state = { currentIdx: 0, score: 0, showingAnswer: false, selectedWasFact: null };

    function render(container) {
      if (state.currentIdx >= pubertyData.length) {
        container.innerHTML = `
          <div class="text-center">
            <div class="success-icon">🎓</div>
            <h2>Quiz Complete!</h2>
            <p>You answered ${state.score} out of ${pubertyData.length} correctly.</p>
            <p>Knowledge is power when it comes to your health.</p>
            <div class="xp-reward">+30 XP Earned</div>
            <button class="btn-play mt-4" id="quiz-finish">Finish</button>
          </div>
        `;
        container.querySelector('#quiz-finish').addEventListener('click', () => {
          addXP(30);
          closeModal();
        });
        return;
      }

      const q = pubertyData[state.currentIdx];

      if (!state.showingAnswer) {
        container.innerHTML = `
          <div class="quiz-progress-bar mb-4">
            <div class="quiz-progress-fill" style="width: ${(state.currentIdx / pubertyData.length) * 100}%"></div>
          </div>
          <h4 class="mb-2 text-light">Question ${state.currentIdx + 1} of ${pubertyData.length}</h4>
          <h2 class="mb-5" style="line-height:1.4;">"${q.statement}"</h2>
          
          <div class="flex-gap">
            <button class="btn-play btn-fact" id="btn-fact">Fact</button>
            <button class="btn-play btn-myth" id="btn-myth" style="background:#FEE2E2; color:#B91C1C;">Myth</button>
          </div>
        `;

        container.querySelector('#btn-fact').addEventListener('click', () => handleAnswer(true));
        container.querySelector('#btn-myth').addEventListener('click', () => handleAnswer(false));
      } else {
        const isCorrect = state.selectedWasFact === q.isFact;
        container.innerHTML = `
          <div class="answer-card ${isCorrect ? 'correct' : 'incorrect'}">
            <h2>${isCorrect ? 'Correct! 🎉' : 'Not quite. 🤔'}</h2>
            <p class="mt-3" style="font-size: 1.1rem; line-height:1.5;">${q.explanation}</p>
          </div>
          <button class="btn-play mt-4" id="btn-next">Next Question</button>
        `;
        container.querySelector('#btn-next').addEventListener('click', () => {
          state.showingAnswer = false;
          state.currentIdx++;
          render(container);
        });
      }
    }

    function handleAnswer(selectedFact) {
      const q = pubertyData[state.currentIdx];
      state.selectedWasFact = selectedFact;
      state.showingAnswer = true;
      if (selectedFact === q.isFact) state.score++;
      render(document.getElementById('quiz-modal-content'));
    }

    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 4: HEALTHY RELATIONSHIPS LEARNING GAME
  // ---------------------------------------------------------
  
  const relationshipScenarios = [
    {
      context: "A friend keeps asking you to share your social media password so they can 'check something'.",
      options: [
        { text: "Share it, they are a close friend.", correct: false, feedback: "Even close friends should respect your digital boundaries. Passwords are private." },
        { text: "Politely decline and explain it's a personal boundary.", correct: true, feedback: "Correct! Healthy relationships are built on respect for each other's privacy and boundaries." }
      ]
    },
    {
      context: "You feel pressured by a partner to do something you aren't comfortable with.",
      options: [
        { text: "Do it anyway to keep them happy.", correct: false, feedback: "Your comfort and consent are the most important things. You always have the right to say no." },
        { text: "Communicate your boundary clearly and say no.", correct: true, feedback: "Perfect. A partner who respects you will always respect your 'no' without pressure." }
      ]
    }
  ];

  function launchRelationships() {
    let state = { currentIdx: 0, showingFeedback: false, feedbackText: "", isCorrect: false };

    function render(container) {
      if (state.currentIdx >= relationshipScenarios.length) {
        container.innerHTML = `
          <div class="text-center">
            <div class="success-icon">🤝</div>
            <h2>Lesson Complete</h2>
            <p>You've learned about setting healthy boundaries and practicing respect.</p>
            <div class="xp-reward">+25 XP Earned</div>
            <button class="btn-play mt-4" id="rel-finish">Finish</button>
          </div>
        `;
        container.querySelector('#rel-finish').addEventListener('click', () => {
          addXP(25);
          closeModal();
        });
        return;
      }

      const s = relationshipScenarios[state.currentIdx];

      if (!state.showingFeedback) {
        container.innerHTML = `
          <h2>Relationship Scenario</h2>
          <p class="mb-4" style="font-size: 1.2rem;">${s.context}</p>
          <div class="options-list">
            ${s.options.map((opt, i) => `<button class="mood-btn option-btn" data-idx="${i}">${opt.text}</button>`).join('')}
          </div>
        `;
        container.querySelectorAll('.option-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-idx'));
            const opt = s.options[idx];
            state.showingFeedback = true;
            state.feedbackText = opt.feedback;
            state.isCorrect = opt.correct;
            render(container);
          });
        });
      } else {
        container.innerHTML = `
          <div class="answer-card ${state.isCorrect ? 'correct' : 'incorrect'}">
            <h2>${state.isCorrect ? 'Great Choice!' : 'Important to Know'}</h2>
            <p class="mt-3" style="font-size: 1.1rem;">${state.feedbackText}</p>
          </div>
          <button class="btn-play mt-4" id="rel-next">Continue</button>
        `;
        container.querySelector('#rel-next').addEventListener('click', () => {
          state.showingFeedback = false;
          state.currentIdx++;
          render(container);
        });
      }
    }
    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 5: DAILY WELLNESS CHALLENGES
  // ---------------------------------------------------------
  
  const wellnessChallenges = [
    { id: 'water', title: "Hydration Hero", task: "Drink 8 glasses of water today.", icon: "💧" },
    { id: 'walk', title: "Nature Reset", task: "Take a 10-minute walk outside.", icon: "🚶" },
    { id: 'gratitude', title: "Gratitude Log", task: "Write down 3 things you are thankful for.", icon: "📝" },
    { id: 'detox', title: "Digital Break", task: "Stay off social media for 1 hour.", icon: "📵" }
  ];

  function launchChallenges() {
    function render(container) {
      container.innerHTML = `
        <h2>Daily Challenges</h2>
        <p class="mb-4">Small steps lead to big changes. Pick a challenge for today!</p>
        <div class="rights-grid" style="grid-template-columns: 1fr;">
          ${wellnessChallenges.map(c => `
            <div class="right-card challenge-item" data-id="${c.id}">
              <div style="font-size: 2rem;">${c.icon}</div>
              <div>
                <div style="font-weight: 600;">${c.title}</div>
                <div style="font-size: 0.9rem; opacity: 0.8;">${c.task}</div>
              </div>
              <button class="btn-play" style="width: auto; padding: 8px 16px; margin-left: auto;">Accept</button>
            </div>
          `).join('')}
        </div>
      `;
      container.querySelectorAll('.challenge-item').forEach(item => {
        item.addEventListener('click', () => {
          container.innerHTML = `
            <div class="text-center">
              <div class="success-icon">🚀</div>
              <h2>Challenge Accepted!</h2>
              <p>Go crush it! Come back tomorrow to log your progress.</p>
              <div class="xp-reward">+5 XP for Accepting</div>
              <button class="btn-play mt-4" id="chal-finish">Finish</button>
            </div>
          `;
          container.querySelector('#chal-finish').addEventListener('click', () => {
            addXP(5);
            closeModal();
          });
        });
      });
    }
    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 6: EMOTIONAL INTELLIGENCE (EQ)
  // ---------------------------------------------------------
  
  function launchEQ() {
    let state = { step: 0 };
    function render(container) {
      if (state.step === 0) {
        container.innerHTML = `
          <h2>Recognizing Emotions</h2>
          <p class="mb-4">Look at this scenario: "Your friend got a lower grade than they expected and is sitting quietly alone."</p>
          <p>What is the most empathetic response?</p>
          <button class="mood-btn eq-btn" data-correct="false">Tell them it's just a grade and to get over it.</button>
          <button class="mood-btn eq-btn" data-correct="true">Sit with them and ask if they want to talk about it.</button>
          <button class="mood-btn eq-btn" data-correct="false">Ignore them so they can have space.</button>
        `;
        container.querySelectorAll('.eq-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const correct = e.target.getAttribute('data-correct') === "true";
            if (correct) {
              state.step = 1;
              render(container);
            } else {
              alert("Empathy involves validating others' feelings. Try again!");
            }
          });
        });
      } else {
        container.innerHTML = `
          <div class="text-center">
            <div class="success-icon">💖</div>
            <h2>EQ Mastery</h2>
            <p>Empathy is a skill that helps us build stronger, more supportive connections.</p>
            <div class="xp-reward">+20 XP Earned</div>
            <button class="btn-play mt-4" id="eq-finish">Finish</button>
          </div>
        `;
        container.querySelector('#eq-finish').addEventListener('click', () => {
          addXP(20);
          closeModal();
        });
      }
    }
    openModal("", render);
  }

  // ---------------------------------------------------------
  // COMPONENT 7: LEARNING HUB MINI LESSONS
  // ---------------------------------------------------------
  
  function launchLessons() {
    const courses = {
      mental: {
        title: "Mental Wellbeing",
        icon: "🧠",
        lessons: [
          { title: "Understanding Stress", text: "Stress is your body's natural alert system. While a little stress helps you focus, chronic stress can affect your health. Try grounding exercises like 'Box Breathing' to reset your nervous system." },
          { title: "The Power of Mindfulness", text: "Mindfulness is about being present in the moment without judgment. It helps reduce anxiety by pulling your focus away from future worries or past regrets." },
          { title: "When to Seek Help", text: "It's okay not to be okay. If you feel overwhelmed, hopeless, or unable to function for more than two weeks, reach out to a trusted adult or a professional counselor." }
        ]
      },
      sexual: {
        title: "Sexual Health",
        icon: "🛡️",
        lessons: [
          { title: "Puberty Basics", text: "Puberty is the transition from childhood to adulthood triggered by hormones. Everyone's timeline is different and perfectly normal." },
          { title: "Consent & Respect", text: "Consent must be enthusiastic, specific, and can be withdrawn at any time. Respecting boundaries is the foundation of any healthy interaction." },
          { title: "Medically Accurate Facts", text: "STIs and pregnancy are preventable through accurate knowledge and protection. Always use trusted, clinical sources for health information." }
        ]
      },
      relationships: {
        title: "Healthy Relationships",
        icon: "🤝",
        lessons: [
          { title: "Communication Skills", text: "Use 'I' statements to express your feelings without blaming others. Example: 'I feel unheard when...' instead of 'You never listen!'" },
          { title: "Identifying Red Flags", text: "A healthy partner respects your privacy, your friends, and your goals. Controlling behavior or isolation are serious red flags." },
          { title: "Setting Boundaries", text: "Boundaries are not walls; they are the gates that let people know how to treat you with respect." }
        ]
      },
      digital: {
        title: "Digital Wellness",
        icon: "📱",
        lessons: [
          { title: "The Highlight Reel", text: "Remember that people mostly post their best moments. Comparing your 'behind-the-scenes' to their 'highlights' can hurt your self-esteem." },
          { title: "Privacy First", text: "Never share passwords or location details. Your digital footprint is permanent; think before you post or share sensitive info." },
          { title: "Sleep & Screens", text: "The blue light from screens can disrupt your sleep cycle. Try a 'digital sunset'—putting away devices 30 minutes before bed." }
        ]
      }
    };

    let currentTrack = null;
    let currentIdx = 0;

    function render(container) {
      if (!currentTrack) {
        // Course Selection Screen
        container.innerHTML = `
          <h2 class="mb-2">Youth Learning Hub</h2>
          <p class="mb-4 text-light">Choose a track to start your wellness journey.</p>
          <div class="course-grid">
            ${Object.keys(courses).map(key => `
              <button class="mood-btn course-btn" data-track="${key}">
                <div style="font-size: 2.5rem; margin-bottom: 10px;">${courses[key].icon}</div>
                <div style="font-weight: 600;">${courses[key].title}</div>
              </button>
            `).join('')}
          </div>
          <div class="mt-5 text-center">
            <a href="#" id="les-emergency" style="color: var(--color-primary); font-weight: 600; text-decoration: underline;">Need help right now? Click here.</a>
          </div>
        `;
        container.querySelectorAll('.course-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            currentTrack = btn.getAttribute('data-track');
            currentIdx = 0;
            render(container);
          });
        });
        container.querySelector('#les-emergency').addEventListener('click', (e) => {
          e.preventDefault();
          renderSafetyScreen();
        });
      } else {
        // Lesson Card Screen
        const track = courses[currentTrack];
        const lesson = track.lessons[currentIdx];
        
        if (currentIdx >= track.lessons.length) {
          container.innerHTML = `
            <div class="text-center">
              <div class="success-icon">🏆</div>
              <h2>Course Complete!</h2>
              <p>You've mastered the basics of <strong>${track.title}</strong>.</p>
              <div class="xp-reward">+30 XP Earned</div>
              <button class="btn-play mt-4" id="les-back">Back to Hub</button>
            </div>
          `;
          container.querySelector('#les-back').addEventListener('click', () => {
            currentTrack = null;
            addXP(30);
            render(container);
          });
          return;
        }

        container.innerHTML = `
          <div class="quiz-progress-bar mb-4">
            <div class="quiz-progress-fill" style="width: ${((currentIdx + 1) / track.lessons.length) * 100}%"></div>
          </div>
          <div class="flex-between mb-2">
            <span class="q-tag tag-time">${track.title}</span>
            <span class="q-tag tag-diff beginner">Card ${currentIdx + 1}/${track.lessons.length}</span>
          </div>
          <h2>${lesson.title}</h2>
          <div class="lesson-card-body mt-4">
            <p style="font-size: 1.2rem; line-height: 1.6; color: var(--color-text);">${lesson.text}</p>
          </div>
          <div class="mt-5 flex-gap">
            <button class="btn-play" id="les-prev" ${currentIdx === 0 ? 'disabled style="opacity: 0.3;"' : ''}>Previous</button>
            <button class="btn-play" id="les-next">${currentIdx === track.lessons.length - 1 ? 'Finish Track' : 'Next Card'}</button>
          </div>
        `;

        container.querySelector('#les-next').addEventListener('click', () => {
          currentIdx++;
          render(container);
        });
        if (currentIdx > 0) {
          container.querySelector('#les-prev').addEventListener('click', () => {
            currentIdx--;
            render(container);
          });
        }
      }
    }
    openModal("", render);
  }

  // Public API
  return {
    launchMentalCheckIn,
    launchBreathing,
    launchMythVsFact,
    launchRelationships,
    launchChallenges,
    launchEQ,
    launchLessons
  };
})();
