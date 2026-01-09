/**
 * URL State Management Utilities
 * Encodes/decodes app state and config to/from URL-safe base64 JSON
 */

/**
 * Encode state and config to URL-safe base64 string
 * @param {Object} data - Event data array
 * @param {Object} config - YAML config object
 * @returns {string} URL-safe base64 encoded string
 */
export function encodeState(data, config) {
  const state = {
    data: data || [],
    config: config || null
  };
  const jsonString = JSON.stringify(state);
  // Convert to base64, then make URL-safe
  const base64 = btoa(unescape(encodeURIComponent(jsonString)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

/**
 * Decode URL-safe base64 string to state and config
 * @param {string} encodedString - URL-safe base64 encoded string
 * @returns {Object} Object with data and config properties
 */
export function decodeState(encodedString) {
  if (!encodedString) {
    return { data: [], config: null };
  }
  
  try {
    // Convert URL-safe base64 back to standard base64
    let base64 = encodedString.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonString = decodeURIComponent(escape(atob(base64)));
    const state = JSON.parse(jsonString);
    return {
      data: state.data || [],
      config: state.config || null
    };
  } catch (error) {
    console.error('Error decoding state:', error);
    return { data: [], config: null };
  }
}

/**
 * Get state from URL hash
 * @returns {Object} Decoded state
 */
export function getStateFromUrl() {
  const hash = window.location.hash.slice(1); // Remove # prefix
  return decodeState(hash);
}

/**
 * Update URL hash with encoded state
 * @param {Array} data - Event data array
 * @param {Object} config - YAML config object
 */
export function updateUrlState(data, config) {
  const encoded = encodeState(data, config);
  window.location.hash = encoded;
  // Also update URL without page reload
  window.history.replaceState(null, '', `#${encoded}`);
}
