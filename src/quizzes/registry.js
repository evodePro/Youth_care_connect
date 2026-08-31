/**
 * YouthCare Connect - Quiz Registry
 * Central registry for all wellness assessments
 * 
 * Quiz Categories:
 * A. Mental Wellness
 * B. Reproductive Health
 * C. Relationship Safety
 * D. Youth Lifestyle & Safety
 */

const QuizRegistry = (() => {
  const quizzes = {};

  /**
   * Register a new quiz
   */
  function register(quiz) {
    quizzes[quiz.id] = {
      ...quiz,
      registeredAt: Date.now()
    };
    return quiz;
  }

  /**
   * Get quiz by ID
   */
  function get(id) {
    return quizzes[id] || null;
  }

  /**
   * List all available quizzes
   */
  function listAll() {
    return Object.values(quizzes).map(q => ({
      id: q.id,
      title: q.title,
      description: q.description,
      category: q.category,
      duration: q.duration,
      difficulty: q.difficulty,
      xpReward: q.xpReward,
      icon: q.icon
    }));
  }

  /**
   * Get quizzes by category
   */
  function getByCategory(category) {
    return Object.values(quizzes).filter(q => q.category === category);
  }

  /**
   * Search quizzes
   */
  function search(query) {
    const lower = query.toLowerCase();
    return Object.values(quizzes).filter(q => 
      q.title.toLowerCase().includes(lower) ||
      q.description.toLowerCase().includes(lower)
    );
  }

  return { register, get, listAll, getByCategory, search };
})();

/**
 * Step Renderers - Map step types to render functions
 */
const StepRenderers = (() => {
  const renderers = {};

  function register(type, renderer) {
    renderers[type] = renderer;
  }

  function get(type) {
    return renderers[type] || defaultRenderer;
  }

  function defaultRenderer(engine, config, state) {
    return `<div class="step-render">
      <p>Step type "${config.type}" not implemented</p>
      <button class="btn-play" data-action="next">Continue</button>
    </div>`;
  }

  return { register, get };
})();

window.QuizRegistry = QuizRegistry;
window.StepRenderers = StepRenderers;