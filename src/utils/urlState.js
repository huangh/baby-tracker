/**
 * URL State Management Utilities
 * Encodes/decodes app state and config to/from URL-safe base64 JSON
 * Supports optional password encryption
 * Encodes/decodes app state with compression, minification, and timestamp optimization
 */

import { encrypt, decrypt, isEncrypted } from './encryption';

// Prefix to identify encrypted URLs
const ENCRYPTED_PREFIX = 'enc:';

import { minifyEvents, expandEvents } from './schemaMapping';
import { compressTimestamp, decompressTimestamp } from './timestampCompression';
import { compressEvents, decompressEvents } from './dataCompression';

/**
 * Encode state to URL-safe base64 string with optimizations
 * @param {Array} events - Event data array (display schema)
 * @param {Object} config - YAML config object (not stored, but kept for compatibility)
 * @returns {string} URL-safe base64 encoded string
 */
export function encodeState(events, config) {
  // Compress timestamps and minify field names
  const processedEvents = (events || []).map(event => {
    const processed = { ...event };
    
    // Compress timestamp: round to 15 minutes and convert to Unix timestamp
    if (processed.timestamp) {
      try {
        const compressed = compressTimestamp(processed.timestamp);
        if (compressed > 0) {
          processed.timestamp = compressed;
        } else {
          console.warn('Invalid timestamp compression result:', compressed, 'for event:', event);
          // Fallback to current time
          processed.timestamp = compressTimestamp(new Date());
        }
      } catch (err) {
        console.error('Error compressing timestamp:', err, 'for event:', event);
        processed.timestamp = compressTimestamp(new Date());
      }
    } else {
      // Missing timestamp - use current time
      processed.timestamp = compressTimestamp(new Date());
    }
    
    return processed;
  });
  
  // Compress old events to summaries
  const compressed = compressEvents(processedEvents);
  
  // Minify field names for URL schema
  const minifiedRecent = minifyEvents(compressed.recent);
  
  const state = {
    r: minifiedRecent, // recent events (minified)
    s: compressed.summaries || [] // summaries (already compact)
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
 * Decode URL-safe base64 string to state
 * @param {string} encodedString - URL-safe base64 encoded string
 * @returns {Object} Object with events array (display schema)
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
    
    // Handle both old format (backward compatibility) and new compressed format
    let events = [];
    
    if (state.data) {
      // Old format: {data: [...], config: ...}
      // Handle old format - timestamps might be ISO strings or already Date objects
      events = state.data.map(event => ({
        ...event,
        timestamp: event.timestamp instanceof Date
          ? event.timestamp
          : (typeof event.timestamp === 'number'
            ? decompressTimestamp(event.timestamp)
            : new Date(event.timestamp))
      }));
    } else if (state.r || state.s) {
      // New compressed format: {r: recent events, s: summaries}
      const compressed = {
        recent: state.r || [],
        summaries: state.s || []
      };
      
      // Expand field names and decompress timestamps
      const expandedRecent = expandEvents(compressed.recent).map(event => {
        let timestamp;
        const tsValue = event.timestamp;
        
        if (tsValue !== undefined && tsValue !== null) {
          if (typeof tsValue === 'number') {
            // Validate it's a reasonable Unix timestamp (not 0 or negative)
            if (tsValue > 0 && tsValue < 2147483647) { // Max 32-bit Unix timestamp
              // Unix timestamp in seconds - decompress it
              timestamp = decompressTimestamp(tsValue);
            } else {
              console.warn('Invalid Unix timestamp:', tsValue, 'in event:', event);
              timestamp = new Date();
            }
          } else if (tsValue instanceof Date) {
            timestamp = tsValue;
          } else {
            // Try to parse as date string
            timestamp = new Date(tsValue);
          }
        } else {
          console.warn('Missing timestamp in event:', event);
          timestamp = new Date();
        }
        
        // Final validation
        if (isNaN(timestamp.getTime())) {
          console.warn('Invalid timestamp after conversion:', tsValue, 'in event:', event);
          timestamp = new Date();
        }
        
        return {
          ...event,
          timestamp: timestamp
        };
      });
      
      // Decompress summaries back to events
      events = decompressEvents({
        recent: expandedRecent,
        summaries: compressed.summaries
      });
    } else {
      // Fallback: assume it's an array of events
      events = Array.isArray(state) ? state : [];
    }
    
    // Ensure all timestamps are Date objects (final pass)
    events = events.map(event => {
      let timestamp;
      if (event.timestamp instanceof Date) {
        timestamp = event.timestamp;
      } else if (typeof event.timestamp === 'number') {
        // Check if it's a Unix timestamp (seconds) or milliseconds
        // Unix timestamps are typically 10 digits (seconds), milliseconds are 13 digits
        if (event.timestamp < 10000000000) {
          // Unix timestamp in seconds
          timestamp = decompressTimestamp(event.timestamp);
        } else {
          // Milliseconds timestamp
          timestamp = new Date(event.timestamp);
        }
      } else if (event.timestamp) {
        timestamp = new Date(event.timestamp);
      } else {
        timestamp = new Date();
      }
      
      // Validate timestamp is not invalid
      if (isNaN(timestamp.getTime())) {
        console.warn('Invalid timestamp in event:', event);
        timestamp = new Date();
      }
      
      return {
        ...event,
        timestamp: timestamp
      };
    });
    
    return {
      data: events,
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
 * @param {Array} data - Event data array (display schema)
 * @param {Object} config - YAML config object (not used, kept for compatibility)
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
