/**
 * URL State Management Utilities
 * Encodes/decodes app state and config to/from URL-safe base64 JSON
 * Supports optional password encryption
 */

import { encrypt, decrypt, isEncrypted } from './encryption';

// Prefix to identify encrypted URLs
const ENCRYPTED_PREFIX = 'enc:';

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
 * Encode and encrypt state with a password
 * @param {Object} data - Event data array
 * @param {Object} config - YAML config object
 * @param {string} password - Password for encryption
 * @returns {Promise<string>} Encrypted URL-safe string
 */
export async function encodeStateEncrypted(data, config, password) {
  const state = {
    data: data || [],
    config: config || null
  };
  const jsonString = JSON.stringify(state);
  const encrypted = await encrypt(jsonString, password);
  return ENCRYPTED_PREFIX + encrypted;
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
 * Decode encrypted state with a password
 * @param {string} encryptedString - Encrypted string (with enc: prefix)
 * @param {string} password - Password for decryption
 * @returns {Promise<Object>} Object with data and config properties
 * @throws {Error} If decryption fails
 */
export async function decodeStateEncrypted(encryptedString, password) {
  if (!encryptedString) {
    return { data: [], config: null };
  }
  
  // Remove the encrypted prefix
  const encrypted = encryptedString.replace(ENCRYPTED_PREFIX, '');
  
  const jsonString = await decrypt(encrypted, password);
  const state = JSON.parse(jsonString);
  return {
    data: state.data || [],
    config: state.config || null
  };
}

/**
 * Check if a URL hash is encrypted
 * @param {string} hash - The URL hash (without # prefix)
 * @returns {boolean} True if the hash is encrypted
 */
export function isUrlEncrypted(hash) {
  return hash && hash.startsWith(ENCRYPTED_PREFIX);
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

/**
 * Generate a shareable URL with optional password encryption
 * @param {Array} data - Event data array
 * @param {Object} config - YAML config object (optional)
 * @param {string} password - Password for encryption (optional, if not provided returns unencrypted URL)
 * @returns {Promise<string>} Full URL with encoded/encrypted state
 */
export async function generateShareableUrl(data, config, password) {
  const baseUrl = window.location.origin + window.location.pathname;
  
  if (password) {
    const encrypted = await encodeStateEncrypted(data, config, password);
    return `${baseUrl}#${encrypted}`;
  } else {
    const encoded = encodeState(data, config);
    return `${baseUrl}#${encoded}`;
  }
}
