/**
 * YouthCare Connect - Question Schema & Validation
 * Formal schema definitions and validation for quiz questions
 * 
 * Design Principles:
 * - Schema validation at definition time
 * - Runtime validation before submission
 * - Clear error messages for developers and users
 * - Support for future i18n/l10n
 */

const QuizSchema = (() => {
  /**
   * Step Types - Supported question types
   */
  const StepTypes = {
    MOOD_SELECT: 'mood-select',
    TEXT_INPUT: 'text-input',
    LIKERT: 'likert',
    MULTI_SELECT: 'multi-select',
    CHECKBOX: 'checkbox',
    TRUE_FALSE: 'true-false',
    MULTIPLE_CHOICE: 'multiple-choice',
    SCENARIO: 'scenario',
    RESULTS: 'results',
    COMPLETION: 'completion'
  };

  /**
   * Quiz Definition Schema
   */
  const QuizDefinitionSchema = {
    id: {
      type: 'string',
      required: true,
      pattern: /^[a-z0-9-]+$/,
      description: 'Unique quiz identifier (lowercase, numbers, hyphens)'
    },
    title: {
      type: 'string',
      required: true,
      minLength: 3,
      maxLength: 100,
      description: 'Display title'
    },
    description: {
      type: 'string',
      required: true,
      minLength: 10,
      maxLength: 500,
      description: 'Brief description shown in quiz list'
    },
    category: {
      type: 'string',
      required: true,
      enum: ['mental', 'reproductive', 'relationship', 'lifestyle'],
      description: 'Quiz category'
    },
    categoryLabel: {
      type: 'string',
      required: true,
      description: 'Display label for category'
    },
    duration: {
      type: 'string',
      required: false,
      pattern: /^\d+\s*min$/,
      description: 'Expected duration (e.g., "5 min")'
    },
    difficulty: {
      type: 'string',
      required: false,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    xpReward: {
      type: 'number',
      required: false,
      min: 0,
      max: 100,
      default: 10
    },
    icon: {
      type: 'string',
      required: false,
      description: 'Emoji or icon identifier'
    },
    color: {
      type: 'string',
      required: false,
      pattern: /^#[0-9A-Fa-f]{6}$/,
      description: 'Accent color hex code'
    },
    steps: {
      type: 'array',
      required: true,
      minLength: 1,
      description: 'Quiz steps/questions'
    },
    scorerType: {
      type: 'string',
      required: false,
      enum: ['simple', 'weighted', 'assessment', 'knowledge'],
      default: 'simple'
    }
  };

  /**
   * Step Schema - Question definition
   */
  const StepSchema = {
    id: {
      type: 'string',
      required: true,
      pattern: /^[a-z0-9-]+$/,
      description: 'Unique step identifier'
    },
    type: {
      type: 'string',
      required: true,
      enum: Object.values(StepTypes),
      description: 'Step rendering type'
    },
    title: {
      type: 'string',
      required: true,
      minLength: 1,
      maxLength: 200,
      description: 'Question title'
    },
    description: {
      type: 'string',
      required: false,
      maxLength: 1000,
      description: 'Question description or instructions'
    },
    required: {
      type: 'boolean',
      default: true
    },
    options: {
      type: 'array',
      required: false,
      description: 'Answer options for choice-based questions'
    },
    scale: {
      type: 'object',
      required: false,
      description: 'Likert scale configuration'
    },
    placeholder: {
      type: 'string',
      required: false,
      description: 'Input placeholder text'
    },
    maxLength: {
      type: 'number',
      required: false,
      min: 10,
      max: 5000,
      description: 'Max text input length'
    },
    correctAnswer: {
      type: 'any',
      required: false,
      description: 'Correct answer for scored questions'
    },
    explanation: {
      type: 'string',
      required: false,
      description: 'Explanation shown after answer'
    },
    weight: {
      type: 'number',
      default: 1,
      description: 'Question weight in scoring'
    },
    points: {
      type: 'number',
      default: 1,
      description: 'Points for correct answer'
    },
    safetyCheck: {
      type: 'boolean',
      default: false,
      description: 'Whether to run safety check on input'
    },
    adaptive: {
      type: 'object',
      required: false,
      description: 'Adaptive logic configuration'
    }
  };

  /**
   * Validator - Schema validation
   */
  const Validator = {
    /**
     * Validate a value against a schema field
     */
    validateField(value, schema, path = '') {
      const errors = [];

      // Required check
      if (schema.required && (value === undefined || value === null)) {
        errors.push(`${path}: is required`);
        return errors;
      }

      // Skip further validation if not required and empty
      if (!schema.required && (value === undefined || value === null)) {
        return errors;
      }

      // Type check
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (schema.type && actualType !== schema.type) {
        errors.push(`${path}: expected ${schema.type}, got ${actualType}`);
        return errors;
      }

      // String validations
      if (schema.type === 'string') {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push(`${path}: must be at least ${schema.minLength} characters`);
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push(`${path}: must be at most ${schema.maxLength} characters`);
        }
        if (schema.pattern && !schema.pattern.test(value)) {
          errors.push(`${path}: does not match required pattern`);
        }
        if (schema.enum && !schema.enum.includes(value)) {
          errors.push(`${path}: must be one of ${schema.enum.join(', ')}`);
        }
      }

      // Number validations
      if (schema.type === 'number') {
        if (schema.min !== undefined && value < schema.min) {
          errors.push(`${path}: must be at least ${schema.min}`);
        }
        if (schema.max !== undefined && value > schema.max) {
          errors.push(`${path}: must be at most ${schema.max}`);
        }
      }

      // Array validations
      if (schema.type === 'array' && Array.isArray(value)) {
        if (schema.minLength && value.length < schema.minLength) {
          errors.push(`${path}: must have at least ${schema.minLength} items`);
        }
        if (schema.maxLength && value.length > schema.maxLength) {
          errors.push(`${path}: must have at most ${schema.maxLength} items`);
        }
      }

      return errors;
    },

    /**
     * Validate an object against a schema
     */
    validate(data, schema, path = '') {
      let errors = [];

      Object.keys(schema).forEach(key => {
        const fieldSchema = schema[key];
        const value = data[key];
        const fieldPath = path ? `${path}.${key}` : key;

        const fieldErrors = this.validateField(value, fieldSchema, fieldPath);
        errors = [...errors, ...fieldErrors];
      });

      return errors;
    },

    /**
     * Validate quiz definition
     */
    validateQuiz(quiz) {
      return this.validate(quiz, QuizDefinitionSchema, 'quiz');
    },

    /**
     * Validate step definition
     */
    validateStep(step, index) {
      const errors = this.validate(step, StepSchema, `steps[${index}]`);
      
      // Additional step-specific validation
      if (step.type === 'likert' && !step.scale) {
        errors.push(`steps[${index}]: likert requires scale configuration`);
      }
      
      if ((step.type === 'multi-select' || step.type === 'checkbox' || step.type === 'scenario') 
          && (!step.options || step.options.length === 0)) {
        errors.push(`steps[${index}]: requires options array`);
      }

      return errors;
    }
  };

  /**
   * Runtime Validator - Validate user input during quiz
   */
  const RuntimeValidator = {
    /**
     * Validate step answer
     */
    validateAnswer(step, answer) {
      const errors = [];

      // Required check
      if (step.required !== false) {
        if (answer === undefined || answer === null) {
          errors.push({ field: 'answer', message: 'This question requires an answer' });
          return { valid: false, errors };
        }

        if (typeof answer === 'string' && answer.trim() === '') {
          errors.push({ field: 'answer', message: 'This question requires an answer' });
          return { valid: false, errors };
        }

        if (Array.isArray(answer) && answer.length === 0) {
          errors.push({ field: 'answer', message: 'Please select at least one option' });
          return { valid: false, errors };
        }
      }

      // Type-specific validation
      switch (step.type) {
        case 'text-input':
          if (answer && step.maxLength && answer.length > step.maxLength) {
            errors.push({ 
              field: 'answer', 
              message: `Response must be ${step.maxLength} characters or less` 
            });
          }
          break;

        case 'likert':
          const scale = step.scale;
          if (answer && scale) {
            const val = parseInt(answer.value);
            if (isNaN(val) || val < scale.min || val > scale.max) {
              errors.push({ field: 'answer', message: 'Please select a valid option' });
            }
          }
          break;

        case 'multi-select':
        case 'checkbox':
          if (step.options) {
            const validOptions = step.options.map(o => o.value);
            const answerArr = Array.isArray(answer) ? answer : (answer.options || []);
            const invalid = answerArr.filter(a => !validOptions.includes(a));
            if (invalid.length > 0) {
              errors.push({ field: 'answer', message: 'Invalid option selected' });
            }
          }
          break;
      }

      return { 
        valid: errors.length === 0, 
        errors 
      };
    },

    /**
     * Validate quiz completion readiness
     */
    validateCompletion(definition, answers) {
      const errors = [];
      const answeredSteps = Object.keys(answers);
      
      definition.steps.forEach((step, index) => {
        if (step.type === 'results' || step.type === 'completion') return;
        if (step.required !== false && !answeredSteps.includes(step.id)) {
          errors.push({ step: step.id, message: `${step.title} requires an answer` });
        }
      });

      return {
        ready: errors.length === 0,
        errors
      };
    }
  };

  return {
    StepTypes,
    QuizDefinitionSchema,
    StepSchema,
    Validator,
    RuntimeValidator
  };
})();

window.QuizSchema = QuizSchema;
window.Validator = QuizSchema.Validator;
window.RuntimeValidator = QuizSchema.RuntimeValidator;