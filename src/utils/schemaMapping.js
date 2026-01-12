/**
 * Schema Mapping Utilities
 * Maps between display schema (full field names) and URL schema (minified)
 */

// Field name mappings: display → URL
export const FIELD_MAPPING = {
  eventType: 't',
  type: 'ty',
  amount: 'a',
  timestamp: 'ts',
  id: 'i',
  consistency: 'c'
};

// Reverse mapping: URL → display
export const REVERSE_MAPPING = Object.fromEntries(
  Object.entries(FIELD_MAPPING).map(([key, value]) => [value, key])
);

/**
 * Minify event object (convert to URL schema)
 * @param {Object} event - Event in display schema
 * @returns {Object} Event in URL schema
 */
export function minifyEvent(event) {
  const minified = {};
  for (const [fullName, shortName] of Object.entries(FIELD_MAPPING)) {
    if (event[fullName] !== undefined) {
      minified[shortName] = event[fullName];
    }
  }
  return minified;
}

/**
 * Expand event object (convert from URL schema to display schema)
 * @param {Object} event - Event in URL schema
 * @returns {Object} Event in display schema
 */
export function expandEvent(event) {
  const expanded = {};
  for (const [shortName, fullName] of Object.entries(REVERSE_MAPPING)) {
    if (event[shortName] !== undefined) {
      expanded[fullName] = event[shortName];
    }
  }
  // Copy any unmapped fields
  for (const key in event) {
    if (!REVERSE_MAPPING[key]) {
      expanded[key] = event[key];
    }
  }
  return expanded;
}

/**
 * Minify array of events
 * @param {Array} events - Array of events in display schema
 * @returns {Array} Array of events in URL schema
 */
export function minifyEvents(events) {
  return events.map(minifyEvent);
}

/**
 * Expand array of events
 * @param {Array} events - Array of events in URL schema
 * @returns {Array} Array of events in display schema
 */
export function expandEvents(events) {
  return events.map(expandEvent);
}

