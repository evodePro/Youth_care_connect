/**
 * YouthCare Connect - Adaptive Flow Engine
 * Dynamic quiz flow based on user responses
 * 
 * Design Principles:
 * - Non-linear paths based on answers
 * - Skip logic for irrelevant questions
 * - Branching scenarios
 * - Fallback handling for incomplete data
 */

const AdaptiveFlow = (() => {
  /**
   * Flow Engine - Handle adaptive navigation
   */
  class FlowEngine {
    constructor(definition) {
      this.definition = definition;
      this.stepIndex = 0;
      this.path = [];
      this.branches = this.buildFlowGraph(definition);
    }

    /**
     * Build flow graph from definition
     */
    buildFlowGraph(definition) {
      const branches = {};
      
      definition.steps.forEach((step, index) => {
        if (step.adaptive) {
          branches[step.id] = {
            index,
            logic: step.adaptive.logic || 'default',
            conditions: step.adaptive.conditions || [],
            skipTo: step.adaptive.skipTo || null,
            branches: step.adaptive.branches || {}
          };
        }
      });

      return branches;
    }

    /**
     * Get next step based on current state
     */
    getNextStep(currentStepId, answer, state) {
      const branch = this.branches[currentStepId];
      
      if (!branch) {
        // Default behavior - next sequential step
        return this.getDefaultNext(currentStepId);
      }

      // Evaluate adaptive conditions
      return this.evaluateConditions(branch, answer, state);
    }

    /**
     * Get default sequential next step
     */
    getDefaultNext(currentStepId) {
      const currentIndex = this.definition.steps.findIndex(s => s.id === currentStepId);
      const nextIndex = currentIndex + 1;
      
      if (nextIndex < this.definition.steps.length) {
        return {
          stepId: this.definition.steps[nextIndex].id,
          type: 'sequential'
        };
      }

      return { stepId: null, type: 'complete' };
    }

    /**
     * Evaluate adaptive conditions
     */
    evaluateConditions(branch, answer, state) {
      const conditions = branch.conditions;
      
      for (const condition of conditions) {
        if (this.matchesCondition(condition, answer, state)) {
          return {
            stepId: condition.skipTo,
            type: 'adaptive',
            reason: condition.reason
          };
        }
      }

      // Check branching
      if (branch.branches) {
        const branchKey = this.getBranchKey(answer);
        if (branch.branches[branchKey]) {
          return {
            stepId: branch.branches[branchKey],
            type: 'branch',
            reason: `branch:${branchKey}`
          };
        }
      }

      // Default to sequential
      return this.getDefaultNext(branch.index.toString());
    }

    /**
     * Check if answer matches condition
     */
    matchesCondition(condition, answer, state) {
      const { field, operator, value } = condition;
      
      // Get value to compare
      let compareValue;
      if (field.startsWith('answer.')) {
        const answerField = field.replace('answer.', '');
        compareValue = answer[answerField];
      } else if (field.startsWith('state.')) {
        const stateField = field.replace('state.', '');
        compareValue = state[stateField];
      } else {
        compareValue = answer;
      }

      // Evaluate operator
      switch (operator) {
        case 'equals':
          return compareValue === value;
        case 'notEquals':
          return compareValue !== value;
        case 'contains':
          if (Array.isArray(compareValue)) {
            return compareValue.includes(value);
          }
          if (typeof compareValue === 'string') {
            return compareValue.includes(value);
          }
          return false;
        case 'greaterThan':
          return parseInt(compareValue) > parseInt(value);
        case 'lessThan':
          return parseInt(compareValue) < parseInt(value);
        case 'includes':
          if (Array.isArray(compareValue)) {
            return compareValue.includes(value);
          }
          return false;
        case 'exists':
          return compareValue !== undefined && compareValue !== null && compareValue !== '';
        default:
          return false;
      }
    }

    /**
     * Get branch key from answer
     */
    getBranchKey(answer) {
      if (typeof answer === 'object' && answer !== null) {
        // Use first non-array value as key
        for (const key of Object.keys(answer)) {
          const val = answer[key];
          if (!Array.isArray(val)) {
            return String(val);
          }
        }
      }
      return 'default';
    }

    /**
     * Get step by ID
     */
    getStep(stepId) {
      return this.definition.steps.find(s => s.id === stepId);
    }

    /**
     * Check if step should be skipped based on previous answers
     */
    shouldSkip(stepId, state) {
      const allAnswers = state.getAnswers();
      const skippedSteps = this.calculateSkippedSteps(allAnswers);
      return skippedSteps.includes(stepId);
    }

    /**
     * Calculate which steps would be skipped
     */
    calculateSkippedSteps(answers) {
      const skipped = [];
      
      Object.entries(answers).forEach(([stepId, answer]) => {
        const next = this.getNextStep(stepId, answer, {});
        if (next.type === 'adaptive' && next.stepId) {
          // Add all steps between current and target
          const currentIndex = this.definition.steps.findIndex(s => s.id === stepId);
          const targetIndex = this.definition.steps.findIndex(s => s.id === next.stepId);
          
          for (let i = currentIndex + 1; i < targetIndex; i++) {
            skipped.push(this.definition.steps[i].id);
          }
        }
      });

      return skipped;
    }

    /**
     * Get flow summary
     */
    getFlowSummary() {
      return {
        totalSteps: this.definition.steps.length,
        adaptiveSteps: Object.keys(this.branches).length,
        branches: Object.keys(this.branches)
      };
    }
  }

  /**
   * Skip Logic - Determine skipped questions
   */
  const SkipLogic = {
    /**
     * Check if step has skip conditions
     */
    hasSkipCondition(step) {
      return step.adaptive && step.adaptive.skipIf;
    },

    /**
     * Evaluate skip condition
     */
    shouldSkipStep(step, previousAnswers) {
      if (!step.adaptive?.skipIf) return false;

      const condition = step.adaptive.skipIf;
      const compareValue = this.getValue(condition.from, previousAnswers);

      return this.evaluateSkipCondition(condition, compareValue);
    },

    /**
     * Get value from answers for comparison
     */
    getValue(path, answers) {
      if (path.startsWith('$')) {
        const stepId = path.replace('$.', '');
        const answer = answers[stepId];
        if (typeof answer === 'object' && answer !== null) {
          return answer.value || answer.mood || answer;
        }
        return answer;
      }
      return null;
    },

    /**
     * Evaluate skip condition operator
     */
    evaluateSkipCondition(condition, value) {
      const { operator, value: compareTo } = condition;

      switch (operator) {
        case 'equals':
          return value === compareTo;
        case 'notEquals':
          return value !== compareTo;
        case 'truthy':
          return !!value;
        case 'falsy':
          return !value;
        case 'greaterThan':
          return parseInt(value) > parseInt(compareTo);
        case 'lessThan':
          return parseInt(value) < parseInt(compareTo);
        default:
          return false;
      }
    }
  };

  /**
   * Branch Handler - Manage quiz branches
   */
  const BranchHandler = {
    /**
     * Get available branches for current step
     */
    getBranches(step, answer) {
      if (!step.adaptive?.branches) return null;
      
      const branchKey = this.getBranchKey(step, answer);
      return {
        current: branchKey,
        options: Object.keys(step.adaptive.branches)
      };
    },

    /**
     * Get branch key from answer
     */
    getBranchKey(step, answer) {
      if (step.adaptive.branchKey) {
        const key = step.adaptive.branchKey;
        if (key === 'likert') {
          return answer.value ? `level-${Math.ceil(answer.value / 2)}` : 'default';
        }
        if (key === 'mood') {
          return answer.mood || 'default';
        }
      }
      return 'default';
    },

    /**
     * Get target step for branch
     */
    getBranchTarget(step, branchKey) {
      return step.adaptive?.branches?.[branchKey] || null;
    }
  };

  /**
   * Flow Analyzer - Analyze quiz flow patterns
   */
  const FlowAnalyzer = {
    /**
     * Analyze potential paths through quiz
     */
    analyzePaths(definition) {
      const paths = [];
      const engine = new FlowEngine(definition);
      
      // Simple path analysis (would be more complex for branching)
      let currentPath = [];
      this.traverse(definition.steps, 0, currentPath, paths);
      
      return {
        totalPaths: paths.length,
        shortestPath: Math.min(...paths.map(p => p.length)),
        longestPath: Math.max(...paths.map(p => p.length)),
        hasBranches: Object.keys(engine.branches).length > 0
      };
    },

    /**
     * Traverse steps to find paths (simplified)
     */
    traverse(steps, index, currentPath, paths) {
      if (index >= steps.length) {
        paths.push([...currentPath]);
        return;
      }

      currentPath.push(steps[index].id);
      this.traverse(steps, index + 1, currentPath, paths);
      currentPath.pop();
    },

    /**
     * Calculate estimated time based on path
     */
    estimateTime(definition, state) {
      const stepCount = definition.steps.length;
      const avgTimePerStep = 30; // seconds
      
      // Adjust for skipped steps
      const skipped = Object.keys(state.getAnswers()).length;
      const effectiveSteps = Math.max(1, stepCount - skipped);
      
      return Math.round((effectiveSteps * avgTimePerStep) / 60); // minutes
    }
  };

  return {
    FlowEngine,
    SkipLogic,
    BranchHandler,
    FlowAnalyzer
  };
})();

window.AdaptiveFlow = AdaptiveFlow;
window.FlowEngine = AdaptiveFlow.FlowEngine;