/**
 * YouthCare Connect - Scoring Engine
 * Modular scoring system with multiple scoring strategies
 * 
 * Design Principles:
 * - Pluggable scoring strategies
 * - Weighted scoring support
 * - Thresholds for different outcome levels
 * - Educational feedback generation
 */

const QuizScoring = (() => {
  /**
   * Base Scorer - Abstract scorer interface
   */
  class BaseScorer {
    constructor(config = {}) {
      this.config = config;
    }

    /**
     * Calculate score from answers
     * @param {Object} answers - User answers
     * @param {Object} definition - Quiz definition
     * @returns {Object} Score result
     */
    calculate(answers, definition) {
      throw new Error('calculate() must be implemented');
    }

    /**
     * Generate interpretation from score
     */
    interpret(score, definition) {
      throw new Error('interpret() must be implemented');
    }
  }

  /**
   * Simple Scorer - Basic percentage-based scoring
   */
  class SimpleScorer extends BaseScorer {
    calculate(answers, definition) {
      const steps = definition.steps.filter(s => s.type !== 'results' && s.type !== 'completion');
      let score = 0;
      let maxScore = 0;

      steps.forEach(step => {
        const answer = answers[step.id];
        if (answer !== undefined && answer !== null && answer !== '') {
          maxScore += step.points || 1;
          if (this.isCorrect(step, answer)) {
            score += step.points || 1;
          }
        }
      });

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      return { score, maxScore, percentage };
    }

    isCorrect(step, answer) {
      if (step.correctAnswer !== undefined) {
        if (step.type === 'true-false') {
          return (answer === 'true') === step.correctAnswer;
        }
        return answer === step.correctAnswer;
      }
      return true; // Non-scored questions always "correct"
    }

    interpret(scoreResult, definition) {
      const { percentage } = scoreResult;
      const thresholds = definition.thresholds || {
        high: 80,
        medium: 50,
        low: 0
      };

      let level;
      if (percentage >= thresholds.high) level = 'high';
      else if (percentage >= thresholds.medium) level = 'medium';
      else level = 'low';

      return {
        ...scoreResult,
        level,
        message: this.getMessage(level),
        suggestions: this.getSuggestions(level)
      };
    }

    getMessage(level) {
      const messages = {
        high: 'Excellent work! You\'ve demonstrated strong understanding.',
        medium: 'Good effort! There\'s room to grow in some areas.',
        low: 'Thank you for participating. Learning is a journey!'
      };
      return messages[level];
    }

    getSuggestions(level) {
      const suggestions = {
        high: ['Keep sharing your knowledge with others', 'Continue exploring related topics'],
        medium: ['Review the topics you found challenging', 'Consider trying related quizzes'],
        low: ['This is a great starting point', 'All quizzes can be retried to improve']
      };
      return suggestions[level];
    }
  }

  /**
   * Weighted Scorer - Score with different weights per question
   */
  class WeightedScorer extends SimpleScorer {
    calculate(answers, definition) {
      const steps = definition.steps.filter(s => s.type !== 'results' && s.type !== 'completion');
      let score = 0;
      let maxScore = 0;

      steps.forEach(step => {
        const answer = answers[step.id];
        const weight = step.weight || 1;
        
        if (answer !== undefined && answer !== null && answer !== '') {
          maxScore += weight;
          if (this.isCorrect(step, answer)) {
            score += weight;
          }
        }
      });

      const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

      return { score, maxScore, percentage };
    }
  }

  /**
   * Assessment Scorer - For wellness assessments (non-binary outcomes)
   */
  class AssessmentScorer extends BaseScorer {
    calculate(answers, definition) {
      const steps = definition.steps.filter(s => s.type !== 'results');
      let totalScore = 0;
      let maxPossible = 0;

      steps.forEach(step => {
        const answer = answers[step.id];
        if (answer === undefined || answer === null) return;

        const stepResult = this.scoreStep(step, answer);
        totalScore += stepResult.score;
        maxPossible += stepResult.maxScore;
      });

      const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;

      return { score: totalScore, maxScore: maxPossible, percentage };
    }

    scoreStep(step, answer) {
      switch (step.type) {
        case 'likert':
          return { score: parseInt(answer.value) || 0, maxScore: step.scale?.max || 5 };
        
        case 'multi-select':
        case 'checkbox':
          const selected = Array.isArray(answer) ? answer : answer.options || [];
          const correct = step.options?.filter(o => o.correct)?.map(o => o.value) || [];
          const hits = selected.filter(s => correct.includes(s)).length;
          return { 
            score: hits, 
            maxScore: correct.length || step.options?.length || 1 
          };
        
        case 'mood-select':
          const moodScores = { great: 5, good: 4, okay: 3, stressed: 2, down: 1 };
          return { 
            score: moodScores[answer.mood] || 3, 
            maxScore: 5 
          };
        
        default:
          return { score: 1, maxScore: 1 };
      }
    }

    interpret(scoreResult, definition) {
      const { percentage, score, maxScore } = scoreResult;
      
      // Custom interpretation from definition or default
      if (definition.scorer && typeof definition.scorer === 'function') {
        return definition.scorer({}, definition) || scoreResult;
      }

      // Default interpretation logic
      let level, message, recommendations;

      if (percentage >= 70) {
        level = 'positive';
        message = 'You\'re doing well in this area!';
        recommendations = ['Keep up the good practices', 'Consider sharing with peers'];
      } else if (percentage >= 40) {
        level = 'moderate';
        message = 'You\'re on the right track.';
        recommendations = ['Small changes can make a big difference', 'Try one new strategy'];
      } else {
        level = 'support';
        message = 'This is a great starting point for reflection.';
        recommendations = ['Consider talking to someone', 'Be patient with yourself'];
      }

      return {
        ...scoreResult,
        level,
        message,
        suggestions: recommendations
      };
    }
  }

  /**
   * Knowledge Scorer - For trivia/educational quizzes
   */
  class KnowledgeScorer extends SimpleScorer {
    calculate(answers, definition) {
      const steps = definition.steps.filter(s => 
        s.type === 'true-false' || 
        s.type === 'multiple-choice' ||
        s.type === 'scenario'
      );
      
      let correct = 0;
      let total = 0;

      steps.forEach(step => {
        const answer = answers[step.id];
        if (answer === undefined || answer === null) return;

        total++;
        if (this.isCorrect(step, answer)) {
          correct++;
        }
      });

      const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

      return { score: correct, maxScore: total, percentage };
    }

    interpret(scoreResult, definition) {
      const { score, maxScore, percentage } = scoreResult;
      
      let message;
      if (percentage >= 80) {
        message = 'Excellent! You have strong knowledge here.';
      } else if (percentage >= 60) {
        message = 'Good understanding! Keep learning.';
      } else {
        message = 'Every question is a learning opportunity.';
      }

      return {
        ...scoreResult,
        level: percentage >= 60 ? 'good' : 'learning',
        message,
        suggestions: [
          'Visit a health center for more information',
          'Talk to peer educators',
          'Practice makes progress'
        ]
      };
    }
  }

  /**
   * Scoring Factory - Create appropriate scorer based on quiz type
   */
  const ScorerFactory = {
    types: {
      simple: SimpleScorer,
      weighted: WeightedScorer,
      assessment: AssessmentScorer,
      knowledge: KnowledgeScorer,
      custom: null // Custom scorer passed in definition
    },

    /**
     * Create scorer for quiz
     */
    create(definition) {
      const scorerType = definition.scorerType || 'simple';
      
      // If definition has custom scorer function
      if (definition.scorer && typeof definition.scorer === 'function') {
        return {
          calculate: (answers, def) => definition.scorer(answers, def),
          interpret: (result, def) => {
            const interpreted = definition.scorer({}, def);
            return { ...result, ...interpreted };
          }
        };
      }

      const ScorerClass = this.types[scorerType] || SimpleScorer;
      return new ScorerClass(definition.config);
    }
  };

  /**
   * Score Calculator - Main entry point for scoring
   */
  const ScoreCalculator = {
    /**
     * Calculate final score for quiz
     */
    calculate(answers, definition) {
      const scorer = ScorerFactory.create(definition);
      const scoreResult = scorer.calculate(answers, definition);
      return scorer.interpret(scoreResult, definition);
    },

    /**
     * Calculate score for a single step
     */
    calculateStep(step, answer) {
      const scorer = ScorerFactory.create({ scorerType: 'simple' });
      return scorer.scoreStep(step, answer);
    }
  };

  return {
    BaseScorer,
    SimpleScorer,
    WeightedScorer,
    AssessmentScorer,
    KnowledgeScorer,
    ScorerFactory,
    ScoreCalculator
  };
})();

window.QuizScoring = QuizScoring;
window.ScoreCalculator = QuizScoring.ScoreCalculator;