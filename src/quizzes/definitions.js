/**
 * YouthCare Connect - Quiz Definitions
 * Comprehensive wellness assessment definitions
 * 
 * Design Principles:
 * - Human-written, scenario-based questions
 * - Psychologically safe, stigma-free language
 * - WHO-style engagement principles
 * - Youth-friendly without being childish
 */

(function() {
  // ============================================
  // QUIZ 1: Mood Check-In (Mental Wellness)
  // ============================================
  QuizRegistry.register({
    id: 'mood-checkin',
    title: 'Daily Mood Tracker',
    description: 'A safe space to reflect on how you are feeling today.',
    category: 'mental',
    categoryLabel: 'Mental Wellness',
    duration: '3 min',
    difficulty: 'beginner',
    xpReward: 10,
    icon: '😊',
    color: '#0D9488',
    
    steps: [
      {
        id: 'mood-selection',
        type: 'mood-select',
        title: 'How are you feeling today?',
        description: 'There are no right or wrong answers. Just check in with yourself.',
        options: [
          { value: 'great', label: '🌟 Great', color: '#10B981' },
          { value: 'good', label: '😊 Good', color: '#22C55E' },
          { value: 'okay', label: '😐 Okay', color: '#F59E0B' },
          { value: 'stressed', label: '😰 Stressed', color: '#F97316' },
          { value: 'down', label: '🌧️ Down', color: '#6366F1' }
        ]
      },
      {
        id: 'reflection',
        type: 'text-input',
        title: 'What\'s contributing to this feeling?',
        description: 'Optional: Share what\'s on your mind. Sometimes writing helps clarify thoughts.',
        placeholder: 'Type your thoughts here...',
        safetyCheck: true,
        maxLength: 500
      },
      {
        id: 'completion',
        type: 'completion',
        xp: 10
      }
    ],

    interpretScore: (percentage) => {
      const mood = 'okay';
      return {
        message: 'Thank you for checking in. Acknowledging your emotions is a healthy practice.',
        suggestions: [
          'Try taking 5 minutes each day to breathe deeply',
          'Talking to a friend can help process difficult feelings'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 2: Burnout Self-Check (Mental Wellness)
  // ============================================
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
      {
        id: 'exhaustion-level',
        type: 'likert',
        title: 'Energy & Exhaustion',
        description: 'In the past two weeks, how often have you felt emotionally exhausted even after sleeping?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
        }
      },
      {
        id: 'school-engagement',
        type: 'likert',
        title: 'School Engagement',
        description: 'How often have you felt detached or uninterested in your schoolwork or classes?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
        }
      },
      {
        id: 'accomplishment',
        type: 'likert',
        title: 'Sense of Accomplishment',
        description: 'How often do you feel like your efforts don\'t make a difference or aren\'t recognized?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Never', 'Rarely', 'Sometimes', 'Often', 'Always']
        }
      },
      {
        id: 'physical-symptoms',
        type: 'multi-select',
        title: 'Physical Signs',
        description: 'Have you experienced any of these recently? (Select all that apply)',
        options: [
          { value: 'headaches', label: 'Frequent headaches' },
          { value: 'sleep-issues', label: 'Trouble sleeping or sleeping too much' },
          { value: 'appetite', label: 'Changes in appetite' },
          { value: 'stomach', label: 'Frequent stomach issues' },
          { value: 'none', label: 'None of these' }
        ]
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      let maxScore = 20;

      const likertScore = (val) => parseInt(val) || 0;
      score += likertScore(answers['exhaustion-level']);
      score += likertScore(answers['school-engagement']);
      score += likertScore(answers['accomplishment']);
      
      if (answers['physical-symptoms'] && answers['physical-symptoms'].includes('none')) {
        // No symptoms is good
      } else if (answers['physical-symptoms']) {
        score += answers['physical-symptoms'].length * 2;
      }

      const percentage = Math.round((score / maxScore) * 100);
      
      let level, message, suggestions;
      
      if (percentage < 30) {
        level = 'low';
        message = 'You seem to be managing well. Keep prioritizing self-care and balance.';
        suggestions = [
          'Continue your healthy habits',
          'Stay connected with friends and activities you enjoy'
        ];
      } else if (percentage < 60) {
        level = 'medium';
        message = 'You are showing some signs of stress. It might help to take some time for yourself.';
        suggestions = [
          'Try to get regular sleep and nutrition',
          'Take short breaks during study time',
          'Consider talking to someone you trust'
        ];
      } else {
        level = 'high';
        message = 'You may be experiencing burnout. Your wellbeing matters, and support is available.';
        suggestions = [
          'Please consider reaching out to a counselor or trusted adult',
          'It\'s okay to take a break and prioritize rest',
          'You don\'t have to handle this alone'
        ];
      }

      return { score, maxScore, percentage, level, message, suggestions };
    }
  });

  // ============================================
  // QUIZ 3: Anxiety Reflection (Mental Wellness)
  // ============================================
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
      {
        id: 'worry-frequency',
        type: 'likert',
        title: 'Worry Patterns',
        description: 'How often do you feel worried about things that might happen in the future?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Not at all', 'Rarely', 'Sometimes', 'Often', 'All the time']
        }
      },
      {
        id: 'physical-anxiety',
        type: 'multi-select',
        title: 'Body Signals',
        description: 'When you feel anxious, do you notice any of these in your body?',
        options: [
          { value: 'racing-heart', label: 'Heart racing or pounding' },
          { value: 'breathing', label: 'Quick or shallow breathing' },
          { value: 'stomach', label: 'Tight stomach or nausea' },
          { value: 'muscles', label: 'Tense muscles' },
          { value: 'trouble-focusing', label: 'Difficulty concentrating' },
          { value: 'none', label: 'None of these' }
        ]
      },
      {
        id: 'coping-strategies',
        type: 'checkbox',
        title: 'What helps you calm down?',
        description: 'Select the strategies that work for you',
        options: [
          { value: 'breathing', label: 'Deep breathing exercises' },
          { value: 'talking', label: 'Talking to someone' },
          { value: 'exercise', label: 'Physical activity or walking' },
          { value: 'music', label: 'Listening to music' },
          { value: 'writing', label: 'Writing or journaling' },
          { value: 'distraction', label: 'Distracting myself' },
          { value: 'none', label: 'Nothing works yet' }
        ]
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const worryScore = parseInt(answers['worry-frequency']) || 0;
      score += worryScore;

      const physical = answers['physical-anxiety'] || [];
      if (physical.includes('none')) {
        // Good
      } else {
        score += physical.length;
      }

      const coping = answers['coping-strategies'] || [];
      const hasHealthy = coping.some(c => ['breathing', 'talking', 'exercise', 'music', 'writing'].includes(c));
      const hasNone = coping.includes('none');

      const maxScore = 12;
      const percentage = Math.round((score / maxScore) * 100);

      let level, message, suggestions;
      
      if (percentage < 30) {
        level = 'manageable';
        message = 'Your anxiety levels seem manageable. Keep using your healthy coping strategies.';
        suggestions = hasHealthy ? [
          'Great job using healthy strategies!',
          'Continue prioritizing self-care'
        ] : [
          'Try adding one new calming technique like deep breathing',
          'Consider talking to someone about how you feel'
        ];
      } else if (percentage < 60) {
        level = 'moderate';
        message = 'You\'re experiencing some anxiety. This is common and there are ways to feel better.';
        suggestions = [
          'Practice deep breathing when you notice anxiety',
          'Try to identify what triggers your worry',
          'Talking to someone can help process feelings'
        ];
      } else {
        level = 'elevated';
        message = 'Your anxiety seems significant. Remember: you don\'t have to face this alone.';
        suggestions = [
          'Consider speaking with a counselor at school or health center',
          'Breathing exercises can help in the moment',
          'It\'s okay to ask for help - it\'s a sign of strength'
        ];
      }

      return { score, maxScore, percentage, level, message, suggestions };
    }
  });

  // ============================================
  // QUIZ 4: STI Awareness (Reproductive Health)
  // ============================================
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
      {
        id: 'q1',
        type: 'true-false',
        title: 'Transmission Truth',
        description: 'You can tell if someone has an STI just by looking at them.',
        correctAnswer: false,
        explanation: 'Many STIs have no visible symptoms at all. The only way to know for sure is through testing.'
      },
      {
        id: 'q2',
        type: 'true-false',
        title: 'Protection Facts',
        description: 'Using a condom correctly every time reduces the risk of most STIs.',
        correctAnswer: true,
        explanation: 'Condoms are highly effective at preventing many STIs when used consistently and correctly.'
      },
      {
        id: 'q3',
        type: 'true-false',
        title: 'Symptom Awareness',
        description: 'If someone has an STI with no symptoms, they can\'t pass it to others.',
        correctAnswer: false,
        explanation: 'Many STIs can be transmitted even when there are no symptoms. This is why regular testing is important.'
      },
      {
        id: 'q4',
        type: 'multiple-choice',
        title: 'Testing Knowledge',
        description: 'Where can someone get STI testing in Rwanda?',
        options: [
          { value: 'health-center', label: 'Health centers and hospitals' },
          { value: 'pharmacy', label: 'Pharmacies (some offer testing)' },
          { value: 'youth-clinic', label: 'Youth-friendly health services' },
          { value: 'all', label: 'All of the above' }
        ],
        correctAnswer: 'all',
        explanation: 'In Rwanda, testing is available at public health centers, some pharmacies, and youth-friendly clinics. Many services are free or low-cost.'
      },
      {
        id: 'q5',
        type: 'true-false',
        title: 'Treatment Facts',
        description: 'Some STIs can be cured with medication, while others can only be managed.',
        correctAnswer: true,
        explanation: 'Bacterial STIs like chlamydia and gonorrhea can be cured with antibiotics. Viral STIs like HIV and herpes can be managed but not cured.'
      },
      {
        id: 'results',
        type: 'quiz-results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const total = 5;
      
      Object.entries(answers).forEach(([qId, answer]) => {
        const step = QuizRegistry.get('sti-awareness').steps.find(s => s.id === qId);
        if (step?.correctAnswer !== undefined) {
          if (step.type === 'true-false') {
            if ((answer === 'true') === step.correctAnswer) score++;
          } else if (step.type === 'multiple-choice') {
            if (answer === step.correctAnswer) score++;
          }
        }
      });

      const percentage = Math.round((score / total) * 100);
      
      let message;
      if (percentage >= 80) {
        message = 'Excellent! You have strong knowledge about STIs. Keep learning and sharing accurate information.';
      } else if (percentage >= 60) {
        message = 'Good understanding! A few areas to review - knowledge is power when it comes to your health.';
      } else {
        message = 'This is a great opportunity to learn more. Accurate information helps keep you and your partners safe.';
      }

      return {
        score,
        maxScore: total,
        percentage,
        message,
        suggestions: [
          'Visit a health center for more information',
          'Remember: getting tested is smart, not embarrassing',
          'Condoms protect against many STIs'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 5: Consent Education (Reproductive Health)
  // ============================================
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
      {
        id: 'consent-definition',
        type: 'scenario',
        title: 'What is Consent?',
        description: 'Sarah and James have been dating for a month. One evening, Sarah agrees to share her location on her phone. A week later, James asks again to check it. What should happen?',
        options: [
          { 
            value: 'always-share', 
            label: 'Sarah should always share because they are dating', 
            correct: false,
            feedback: 'Being in a relationship doesn\'t mean giving up privacy. Every request is a new decision.'
          },
          { 
            value: 'say-no', 
            label: 'Sarah can say no if she\'s not comfortable', 
            correct: true,
            feedback: 'Correct! Consent is ongoing - someone can change their mind at any time.'
          },
          { 
            value: 'ask-once', 
            label: 'James should only ask once and accept the answer', 
            correct: true,
            feedback: 'Exactly! A respectful partner accepts the answer without pressure.'
          }
        ]
      },
      {
        id: 'enthusiastic-consent',
        type: 'likert',
        title: 'Recognizing Consent',
        description: 'How would you describe enthusiastic consent?',
        scale: {
          min: 1,
          max: 4,
          labels: ['Silence or just going along', 'Saying "maybe"', 'Saying "yes" clearly', 'An enthusiastic "yes!" with clear interest']
        }
      },
      {
        id: 'coercion-recognition',
        type: 'multi-select',
        title: 'Warning Signs',
        description: 'Which of these might be signs of coercion or pressure? (Select all that apply)',
        options: [
          { value: 'guilt-tripping', label: 'Using guilt to get what they want' },
          { value: 'threats', label: 'Threatening to end the relationship' },
          { value: 'drunk', label: 'Taking advantage when someone is drunk' },
          { value: 'compliments', label: 'Giving compliments' },
          { value: 'pressure', label: 'Repeatedly asking after "no"' },
          { value: 'none', label: 'None of these are concerning' }
        ]
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const maxScore = 10;

      const scenarioAnswers = answers['consent-definition'];
      if (scenarioAnswers && Array.isArray(scenarioAnswers)) {
        score += scenarioAnswers.filter(a => a === 'say-no' || a === 'ask-once').length;
      }

      const consentScore = parseInt(answers['enthusiastic-consent']) || 0;
      if (consentScore >= 3) score += 3;
      else if (consentScore === 2) score += 1;

      const coercion = answers['coercion-recognition'] || [];
      const concerning = ['guilt-tripping', 'threats', 'drunk', 'pressure'];
      const correctSelections = concerning.filter(c => coercion.includes(c));
      score += correctSelections.length;

      const percentage = Math.round((score / maxScore) * 100);
      
      return {
        score,
        maxScore,
        percentage,
        level: percentage >= 70 ? 'good' : percentage >= 40 ? 'developing' : 'learning',
        message: 'Understanding consent is about respecting yourself and others.',
        suggestions: [
          'Consent is "yes" - not the absence of "no"',
          'Everyone has the right to change their mind',
          'A healthy relationship respects boundaries'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 6: Myth vs Fact Challenge (Reproductive)
  // ============================================
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
      {
        id: 'myth1',
        type: 'true-false',
        title: 'Puberty Myth',
        description: 'Acne means you are not washing your face enough.',
        correctAnswer: false,
        explanation: 'Myth! Acne during puberty is caused by hormonal changes that increase oil production, not by poor hygiene.'
      },
      {
        id: 'myth2',
        type: 'true-false',
        title: 'Timeline Fact',
        description: 'Everyone goes through puberty at different times.',
        correctAnswer: true,
        explanation: 'Fact! Puberty can start anywhere between ages 8 and 14. Everyone\'s body runs on its own healthy timeline.'
      },
      {
        id: 'myth3',
        type: 'true-false',
        title: 'Contraception Myth',
        description: 'The pull-out method is as effective as condoms at preventing pregnancy.',
        correctAnswer: false,
        explanation: 'Myth! Pull-out is not reliable. Condoms (used correctly) are much more effective at preventing pregnancy.'
      },
      {
        id: 'myth4',
        type: 'true-false',
        title: 'STI Fact',
        description: 'Two condoms are better than one at preventing STIs.',
        correctAnswer: false,
        explanation: 'Myth! Using two condoms can actually cause friction and increase the chance of breaking. One condom is the way to go!'
      },
      {
        id: 'results',
        type: 'quiz-results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const total = 4;

      Object.entries(answers).forEach(([qId, answer]) => {
        const quiz = QuizRegistry.get('myth-fact');
        const step = quiz?.steps.find(s => s.id === qId);
        if (step?.correctAnswer !== undefined) {
          if ((answer === 'true') === step.correctAnswer) score++;
        }
      });

      const percentage = Math.round((score / total) * 100);
      
      return {
        score,
        maxScore: total,
        percentage,
        message: score >= 3 ? 'Great job separating fact from fiction!' : 'Keep learning - accurate information protects your health.',
        suggestions: [
          'Always verify health information with trusted sources',
          'Talk to a health provider for accurate answers',
          'Share correct information with friends'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 7: Toxic Relationship Detection
  // ============================================
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
      {
        id: 'control-patterns',
        type: 'scenario',
        title: 'Digital Boundaries',
        description: 'A partner constantly asks for your social media passwords "because they trust you." What do you do?',
        options: [
          { 
            value: 'share-password', 
            label: 'Share the password - it shows you trust them', 
            correct: false,
            feedback: 'Even in trusting relationships, passwords are personal. Healthy partners respect digital privacy.'
          },
          { 
            value: 'decline-politely', 
            label: 'Politely decline and explain it\'s a personal boundary', 
            correct: true,
            feedback: 'Correct! Healthy relationships are built on respect for each other\'s privacy.'
          },
          { 
            value: 'get-angry', 
            label: 'Get angry and refuse', 
            correct: false,
            feedback: 'While it\'s okay to assert boundaries, communicating calmly is healthier.'
          }
        ]
      },
      {
        id: 'pressure-scenarios',
        type: 'scenario',
        title: 'Handling Pressure',
        description: 'Your partner pressures you to do something you\'re not comfortable with, saying "if you loved me you would." What\'s the healthy response?',
        options: [
          { 
            value: 'give-in', 
            label: 'Do it to keep the peace', 
            correct: false,
            feedback: 'Your comfort matters more than pressure. True love respects boundaries.'
          },
          { 
            value: 'clear-no', 
            label: 'Communicate your boundary clearly and say no', 
            correct: true,
            feedback: 'Exactly! A partner who respects you will always accept your "no" without pressure.'
          },
          { 
            value: 'ignore', 
            label: 'Ignore them and avoid the topic', 
            correct: false,
            feedback: 'Open communication is key. Avoiding important topics isn\'t healthy.'
          }
        ]
      },
      {
        id: 'red-flags',
        type: 'multi-select',
        title: 'Warning Signs',
        description: 'Which are potential red flags in a relationship?',
        options: [
          { value: 'isolation', label: 'Trying to isolate you from friends/family' },
          { value: 'jealousy', label: 'Extreme jealousy without reason' },
          { value: 'criticism', label: 'Constant criticism or put-downs' },
          { value: 'checking-phone', label: 'Checking your phone without permission' },
          { value: 'supportive', label: 'Supporting your goals and dreams' },
          { value: 'good-communication', label: 'Good communication and honesty' }
        ]
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const maxScore = 10;

      const scenarios = ['control-patterns', 'pressure-scenarios'];
      scenarios.forEach(id => {
        const answer = answers[id];
        if (answer && Array.isArray(answer)) {
          score += answer.filter(a => a === 'decline-politely' || a === 'clear-no').length * 2;
        }
      });

      const redFlags = answers['red-flags'] || [];
      const positiveBehaviors = ['supportive', 'good-communication'];
      const correctFlags = ['isolation', 'jealousy', 'criticism', 'checking-phone'].filter(f => redFlags.includes(f));
      score += correctFlags.length;

      const percentage = Math.round((score / maxScore) * 100);
      
      let level, message;
      if (percentage >= 70) {
        level = 'healthy';
        message = 'Great awareness of healthy relationship patterns!';
      } else if (percentage >= 40) {
        level = 'learning';
        message = 'You\'re developing important relationship skills.';
      } else {
        level = 'needs-attention';
        message = 'Learning about healthy relationships is always valuable.';
      }

      return {
        score,
        maxScore,
        percentage,
        level,
        message,
        suggestions: [
          'Healthy relationships include respect, trust, and communication',
          'You deserve to be with someone who values your boundaries',
          'It\'s okay to end relationships that don\'t serve you'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 8: Online Safety Awareness (Lifestyle)
  // ============================================
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
      {
        id: 'privacy-basics',
        type: 'scenario',
        title: 'Privacy Protection',
        description: 'Someone you don\'t know well asks for your phone number online. What do you do?',
        options: [
          { 
            value: 'share-it', 
            label: 'Share it - they seem nice', 
            correct: false,
            feedback: 'Be careful! Sharing personal information with strangers can be risky.'
          },
          { 
            value: 'decline', 
            label: 'Politely decline', 
            correct: true,
            feedback: 'Correct! Protecting your personal information is smart online safety.'
          },
          { 
            value: 'ask-friends', 
            label: 'Ask friends if it\'s okay first', 
            correct: false,
            feedback: 'Your safety is your decision. Trust your instincts over others\' opinions.'
          }
        ]
      },
      {
        id: 'digital-footprint',
        type: 'true-false',
        title: 'Digital Memory',
        description: 'Anything you post online can be there forever, even if you delete it.',
        correctAnswer: true,
        explanation: 'True! Screenshots, archives, and cached versions can preserve content. Think before you post.'
      },
      {
        id: 'social-media',
        type: 'multi-select',
        title: 'Safe Social Media',
        description: 'Which practices help keep you safe on social media?',
        options: [
          { value: 'private-accounts', label: 'Using private account settings' },
          { value: 'accept-all', label: 'Accepting all friend requests' },
          { value: 'location-off', label: 'Turning off location sharing' },
          { value: 'share-passwords', label: 'Sharing passwords with close friends' },
          { value: 'think-before', label: 'Thinking before posting' }
        ]
      },
      {
        id: 'results',
        type: 'quiz-results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const maxScore = 8;

      const scenario = answers['privacy-basics'];
      if (scenario && Array.isArray(scenario) && scenario.includes('decline')) {
        score += 3;
      }

      const footprint = answers['digital-footprint'];
      if ((footprint === 'true') === true) score += 2;

      const social = answers['social-media'] || [];
      const safe = ['private-accounts', 'location-off', 'think-before'].filter(s => social.includes(s));
      score += safe.length;

      const percentage = Math.round((score / maxScore) * 100);
      
      return {
        score,
        maxScore,
        percentage,
        message: percentage >= 60 ? 'Great digital safety awareness!' : 'Keep learning to protect yourself online.',
        suggestions: [
          'Your digital footprint is permanent',
          'Only share with people you trust in real life',
          'Report anything that makes you uncomfortable'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 9: Peer Pressure Reflection (Lifestyle)
  // ============================================
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
      {
        id: 'pressure-scenarios',
        type: 'scenario',
        title: 'Standing Your Ground',
        description: 'Your friends are doing something you\'re not comfortable with, and they say "Come on, don\'t be lame." What do you do?',
        options: [
          { 
            value: 'join-in', 
            label: 'Join in to not feel left out', 
            correct: false,
            feedback: 'Your values matter more than peer approval. Real friends respect your choices.'
          },
          { 
            value: 'speak-up', 
            label: 'Speak up and say you\'re not comfortable', 
            correct: true,
            feedback: 'Exactly! Being true to yourself takes courage and builds respect.'
          },
          { 
            value: 'leave', 
            label: 'Leave the situation quietly', 
            correct: true,
            feedback: 'It\'s okay to remove yourself from uncomfortable situations.'
          },
          { 
            value: 'lie', 
            label: 'Make up an excuse', 
            correct: false,
            feedback: 'While avoiding conflict, being honest is better for relationships.'
          }
        ]
      },
      {
        id: 'assertiveness',
        type: 'likert',
        title: 'Speaking Up',
        description: 'How comfortable are you saying "no" when you don\'t want to do something?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Very uncomfortable', 'Somewhat uncomfortable', 'Neutral', 'Somewhat comfortable', 'Very comfortable']
        }
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      let score = 0;
      const maxScore = 8;

      const scenario = answers['pressure-scenarios'];
      if (scenario && Array.isArray(scenario)) {
        score += scenario.filter(s => s === 'speak-up' || s === 'leave').length * 2;
      }

      const comfort = parseInt(answers['assertiveness']) || 0;
      score += comfort;

      const percentage = Math.round((score / maxScore) * 100);
      
      return {
        score,
        maxScore,
        percentage,
        message: 'Saying no is a skill that gets easier with practice.',
        suggestions: [
          'Practice confident "no" phrases in the mirror',
          'Real friends respect your boundaries',
          'Your choices matter more than others\' opinions'
        ]
      };
    }
  });

  // ============================================
  // QUIZ 10: Stress Check-In (Mental Wellness)
  // ============================================
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
      {
        id: 'stress-level',
        type: 'likert',
        title: 'Current Stress Level',
        description: 'In the past week, how stressed have you felt overall?',
        scale: {
          min: 1,
          max: 5,
          labels: ['Not at all stressed', 'A little stressed', 'Moderately stressed', 'Very stressed', 'Extremely stressed']
        }
      },
      {
        id: 'stress-sources',
        type: 'multi-select',
        description: 'What has been causing you stress? (Select all that apply)',
        title: 'Stress Sources',
        options: [
          { value: 'school', label: 'School or studies' },
          { value: 'family', label: 'Family issues' },
          { value: 'relationships', label: 'Friends or relationships' },
          { value: 'future', label: 'Worrying about the future' },
          { value: 'money', label: 'Money or basics' },
          { value: 'health', label: 'Health concerns' },
          { value: 'other', label: 'Other' }
        ]
      },
      {
        id: 'coping-check',
        type: 'checkbox',
        title: 'Coping Strategies',
        description: 'What do you do to manage stress?',
        options: [
          { value: 'exercise', label: 'Exercise or physical activity' },
          { value: 'sleep', label: 'Rest and sleep' },
          { value: 'friends', label: 'Talk to friends/family' },
          { value: 'hobbies', label: 'Do hobbies I enjoy' },
          { value: 'prayer', label: 'Prayer or spiritual practice' },
          { value: 'music', label: 'Listen to music' },
          { value: 'none', label: 'I don\'t have healthy ways yet' }
        ]
      },
      {
        id: 'results',
        type: 'results'
      }
    ],

    scorer: (answers) => {
      const stressLevel = parseInt(answers['stress-level']) || 1;
      const coping = answers['coping-check'] || [];
      const hasHealthy = coping.some(c => c !== 'none' && c !== 'other');
      
      let score = 0;
      const maxScore = 10;
      
      if (stressLevel <= 2) score += 3;
      else if (stressLevel <= 3) score += 2;
      else score += 1;
      
      if (hasHealthy) score += 4;
      else if (coping.includes('none')) score += 1;

      const percentage = Math.round((score / maxScore) * 100);
      
      return {
        score,
        maxScore,
        percentage,
        level: percentage >= 60 ? 'manageable' : 'needs-attention',
        message: hasHealthy 
          ? 'Great job using healthy coping strategies!' 
          : 'Building healthy coping skills takes time. Start with one small thing.',
        suggestions: hasHealthy ? [
          'Keep prioritizing your healthy habits',
          'Share your coping strategies with friends'
        ] : [
          'Try one new activity like walking or talking to someone',
          'It\'s okay to ask for help with stress',
          'Basic self-care (sleep, food, rest) makes a big difference'
        ]
      };
    }
  });

})();

window.QuizRegistry = QuizRegistry;
window.StepRenderers = StepRenderers;