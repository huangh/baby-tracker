/**
 * Timestamp Compression Utilities
 * Round timestamps to 15-minute increments and convert to Unix timestamps
 */

const MINUTE_MS = 60 * 1000;
const FIFTEEN_MINUTES_MS = 15 * MINUTE_MS;

/**
 * Round timestamp down to nearest 15-minute increment in the past
 * @param {Date|number|string} timestamp - Timestamp to round
 * @returns {Date} Rounded Date object
 */
export function roundTo15Minutes(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const ms = date.getTime();
  const roundedMs = Math.floor(ms / FIFTEEN_MINUTES_MS) * FIFTEEN_MINUTES_MS;
  return new Date(roundedMs);
}

/**
 * Convert Date to Unix timestamp (seconds since epoch)
 * @param {Date|number|string} timestamp - Timestamp to convert
 * @returns {number} Unix timestamp in seconds
 */
export function dateToUnix(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  return Math.floor(date.getTime() / 1000);
}

/**
 * Convert Unix timestamp (seconds) to Date
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {Date} Date object
 */
export function unixToDate(unixTimestamp) {
  return new Date(unixTimestamp * 1000);
}

/**
 * Compress timestamp: round to 15 minutes and convert to Unix
 * @param {Date|number|string} timestamp - Timestamp to compress
 * @returns {number} Unix timestamp in seconds (rounded to 15-minute increments)
 */
export function compressTimestamp(timestamp) {
  const rounded = roundTo15Minutes(timestamp);
  return dateToUnix(rounded);
}

/**
 * Decompress timestamp: convert Unix to Date
 * @param {number} unixTimestamp - Unix timestamp in seconds
 * @returns {Date} Date object
 */
export function decompressTimestamp(unixTimestamp) {
  return unixToDate(unixTimestamp);
}

