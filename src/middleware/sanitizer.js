/**
 * Input Sanitizer
 * Sanitizes inputs to prevent injection and XSS attacks.
 */

const Sanitizer = (() => {
  /**
   * Strip HTML tags from a string
   * @param {string} input - Input string
   * @returns {string} Sanitized string
   */
  function stripHtml(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/<[^>]*>/g, '');
  }

  /**
   * Escape special HTML characters
   * @param {string} input - Input string
   * @returns {string} HTML-escaped string
   */
  function escapeHtml(input) {
    if (typeof input !== 'string') return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    return input.replace(/[&<>"'/]/g, char => map[char]);
  }

  /**
   * Normalize whitespace (collapse multiple spaces/tabs to single space)
   * @param {string} input - Input string
   * @returns {string} Normalized string
   */
  function normalizeWhitespace(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/\s+/g, ' ').trim();
  }

  /**
   * Remove control characters
   * @param {string} input - Input string
   * @returns {string} Clean string
   */
  function removeControlChars(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Sanitize a username
   * @param {string} username - Raw username
   * @returns {string} Sanitized username
   */
  function sanitizeUsername(username) {
    if (typeof username !== 'string') return '';
    return normalizeWhitespace(
      stripHtml(username)
    );
  }

  /**
   * Sanitize a message content
   * @param {string} content - Raw message content
   * @returns {string} Sanitized content
   */
  function sanitizeMessageContent(content) {
    if (typeof content !== 'string') return '';
    return normalizeWhitespace(
      removeControlChars(content)
    );
  }

  /**
   * Sanitize an email
   * @param {string} email - Raw email
   * @returns {string} Sanitized email
   */
  function sanitizeEmail(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  /**
   * Sanitize a full name
   * @param {string} name - Raw name
   * @returns {string} Sanitized name
   */
  function sanitizeName(name) {
    if (typeof name !== 'string') return '';
    return normalizeWhitespace(
      stripHtml(name)
    );
  }

  /**
   * Sanitize a generic string
   * @param {string} input - Raw input
   * @param {boolean} escape - Whether to HTML-escape (for display)
   * @returns {string} Sanitized string
   */
  function sanitizeString(input, escape = false) {
    if (typeof input !== 'string') return '';
    let result = stripHtml(input);
    result = normalizeWhitespace(result);
    if (escape) {
      result = escapeHtml(result);
    }
    return result;
  }

  /**
   * Sanitize an object of fields
   * @param {object} data - Object with fields to sanitize
   * @param {object} schema - Schema defining which sanitizer to use per field
   * @returns {object} Sanitized object
   */
  function sanitizeObject(data, schema) {
    const sanitized = {};

    for (const [field, sanitizer] of Object.entries(schema)) {
      if (data[field] !== undefined && data[field] !== null) {
        sanitized[field] = sanitizer(data[field]);
      }
    }

    return sanitized;
  }

  return {
    stripHtml,
    escapeHtml,
    normalizeWhitespace,
    removeControlChars,
    sanitizeUsername,
    sanitizeMessageContent,
    sanitizeEmail,
    sanitizeName,
    sanitizeString,
    sanitizeObject
  };
})();

if (typeof window !== 'undefined') {
  window.Sanitizer = Sanitizer;
}