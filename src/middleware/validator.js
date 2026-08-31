/**
 * Input Validator
 * Validates all inputs before they reach business logic.
 */

const Validator = (() => {
  const rules = {
    username: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z0-9_\-\s]+$/,
      message: 'Username must be 2-50 characters and contain only letters, numbers, spaces, hyphens, and underscores'
    },
    message: {
      maxLength: 5000,
      message: 'Message exceeds maximum length of 5000 characters'
    },
    uuid: {
      pattern: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      message: 'Invalid UUID format'
    },
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }
  };

  /**
   * Validate a username
   * @param {string} username - Username to validate
   * @returns {object} Validation result { valid: boolean, error?: string }
   */
  function validateUsername(username) {
    if (!username || typeof username !== 'string') {
      return { valid: false, error: 'Username is required' };
    }

    const trimmed = username.trim();
    const rule = rules.username;

    if (trimmed.length < rule.minLength) {
      return { valid: false, error: `Username must be at least ${rule.minLength} characters` };
    }

    if (trimmed.length > rule.maxLength) {
      return { valid: false, error: `Username must not exceed ${rule.maxLength} characters` };
    }

    if (!rule.pattern.test(trimmed)) {
      return { valid: false, error: rule.message };
    }

    return { valid: true, value: trimmed };
  }

  /**
   * Validate a message
   * @param {string} content - Message content to validate
   * @returns {object} Validation result
   */
  function validateMessageContent(content) {
    if (!content || typeof content !== 'string') {
      return { valid: false, error: 'Message content is required' };
    }

    const trimmed = content.trim();

    if (trimmed.length === 0) {
      return { valid: false, error: 'Message cannot be empty' };
    }

    if (trimmed.length > rules.message.maxLength) {
      return { valid: false, error: rules.message.message };
    }

    return { valid: true, value: trimmed };
  }

  /**
   * Validate a UUID
   * @param {string} id - UUID to validate
   * @param {string} fieldName - Name of field for error message
   * @returns {object} Validation result
   */
  function validateUUID(id, fieldName = 'ID') {
    if (!id || typeof id !== 'string') {
      return { valid: false, error: `${fieldName} is required` };
    }

    if (!rules.uuid.pattern.test(id)) {
      return { valid: false, error: rules.uuid.message };
    }

    return { valid: true, value: id };
  }

  /**
   * Validate role
   * @param {string} role - Role to validate
   * @returns {object} Validation result
   */
  function validateRole(role) {
    const validRoles = ['youth', 'advisor', 'system'];

    if (!role || typeof role !== 'string') {
      return { valid: false, error: 'Role is required' };
    }

    const normalized = role.toLowerCase().trim();

    if (!validRoles.includes(normalized)) {
      return { valid: false, error: `Role must be one of: ${validRoles.join(', ')}` };
    }

    return { valid: true, value: normalized };
  }

  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {object} Validation result
   */
  function validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }

    const trimmed = email.trim().toLowerCase();

    if (!rules.email.pattern.test(trimmed)) {
      return { valid: false, error: rules.email.message };
    }

    return { valid: true, value: trimmed };
  }

  /**
   * Validate an object against a schema
   * @param {object} data - Data to validate
   * @param {object} schema - Validation schema
   * @returns {object} Validation result with errors
   */
  function validateSchema(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      if (rules.required && (value === undefined || value === null || value === '')) {
        errors[field] = `${field} is required`;
        isValid = false;
        continue;
      }

      if (value !== undefined && value !== null && value !== '') {
        const validatorFn = validators[rules.type];
        if (validatorFn) {
          const result = validatorFn(value, rules);
          if (!result.valid) {
            errors[field] = result.error;
            isValid = false;
          }
        }
      }
    }

    return { valid: isValid, errors, data };
  }

  const validators = {
    string: (value, rules) => {
      if (rules.minLength && value.length < rules.minLength) {
        return { valid: false, error: `${rules.fieldName || 'Field'} must be at least ${rules.minLength} characters` };
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return { valid: false, error: `${rules.fieldName || 'Field'} must not exceed ${rules.maxLength} characters` };
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return { valid: false, error: rules.message || `Invalid format` };
      }
      return { valid: true };
    },
    uuid: (value) => validateUUID(value),
    email: (value) => validateEmail(value)
  };

  return {
    validateUsername,
    validateMessageContent,
    validateUUID,
    validateRole,
    validateEmail,
    validateSchema,
    rules
  };
})();

if (typeof window !== 'undefined') {
  window.Validator = Validator;
}