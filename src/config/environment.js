/**
 * Environment Configuration
 * Centralizes all configuration values.
 * In production, these should be loaded from environment variables.
 */

const Environment = (() => {
  const _config = {
    supabase: {
      url: 'https://sbkynohpfovewirneggn.supabase.co',
      anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNia3lub2hwZm92ZXdpcm5lZ2duIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTk1MzksImV4cCI6MjA5MTQ3NTUzOX0.fPdU8NXFarXnfAM9HlxCIkBUUrxxLMSSc6G3Nz-q8OI',
      options: {
        auth: {
          persistSession: true,
          autoRefreshToken: true
        }
      }
    },
    api: {
      timeout: 30000,
      maxRetries: 3
    },
    validation: {
      maxMessageLength: 5000,
      maxUsernameLength: 50,
      minUsernameLength: 2
    }
  };

  function getSupabaseConfig() {
    return { ..._config.supabase };
  }

  function getApiConfig() {
    return { ..._config.api };
  }

  function getValidationRules() {
    return { ..._config.validation };
  }

  return {
    getSupabaseConfig,
    getApiConfig,
    getValidationRules
  };
})();

if (typeof window !== 'undefined') {
  window.Environment = Environment;
}