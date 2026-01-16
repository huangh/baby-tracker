import LZString from 'lz-string';

/**
 * Compresses a JSON object and encodes it to a Base64 string.
 * Uses lz-string for compression.
 * 
 * @param {any} data - The JSON data to compress
 * @returns {string} - The compressed and Base64 encoded string
 */
export function compressAndEncode(data) {
  try {
    const jsonString = JSON.stringify(data);
    return LZString.compressToBase64(jsonString);
  } catch (error) {
    console.error('Error compressing data:', error);
    return '';
  }
}

/**
 * Decodes a Base64 string and decompresses it back to a JSON object.
 * 
 * @param {string} encodedString - The compressed and Base64 encoded string
 * @returns {any} - The original JSON data, or null if decompression fails
 */
export function decodeAndDecompress(encodedString) {
  try {
    if (!encodedString) return null;
    const jsonString = LZString.decompressFromBase64(encodedString);
    if (!jsonString) return null;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error decompressing data:', error);
    return null;
  }
}
