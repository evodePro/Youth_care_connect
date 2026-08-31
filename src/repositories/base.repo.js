/**
 * Base Repository
 * Provides common database operations and Supabase client management.
 */

const BaseRepository = (() => {
  let _client = null;
  let _initialized = false;

  /**
   * Initialize Supabase client
   * @returns {object} Supabase client instance
   */
  function initialize() {
    if (_initialized && _client) {
      return _client;
    }

    if (!window.supabase || !window.supabase.createClient) {
      throw new Error('Supabase client not available. Ensure supabase-js is loaded.');
    }

    const envConfig = Environment.getSupabaseConfig();
    _client = window.supabase.createClient(envConfig.url, envConfig.anonKey, envConfig.options);
    _initialized = true;
    window.supabaseClient = _client;
    
    return _client;
  }

  /**
   * Get Supabase client instance
   * @returns {object} Supabase client
   */
  function getClient() {
    if (!_initialized) {
      return initialize();
    }
    return _client;
  }

  /**
   * Execute a database operation with error handling
   * @param {Function} operation - Async function returning Supabase result
   * @returns {Promise<object>} Standardized result { data, error }
   */
  async function execute(operation) {
    try {
      const result = await operation();
      
      if (result.error) {
        return { data: null, error: result.error };
      }
      
      return { data: result.data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  /**
   * Check if client is initialized
   * @returns {boolean} Initialization status
   */
  function isInitialized() {
    return _initialized;
  }

  return {
    initialize,
    getClient,
    execute,
    isInitialized
  };
})();

if (typeof window !== 'undefined') {
  window.BaseRepository = BaseRepository;
}