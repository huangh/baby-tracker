/**
 * Encryption Utilities
 * Uses Web Crypto API for AES-GCM encryption with PBKDF2 key derivation
 */

/**
 * Derive a cryptographic key from a password
 * @param {string} password - The password to derive key from
 * @param {Uint8Array} salt - The salt for key derivation
 * @returns {Promise<CryptoKey>} The derived key
 */
async function deriveKey(password, salt) {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  
  // Import password as raw key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );
  
  // Derive AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert ArrayBuffer to URL-safe base64 string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} URL-safe base64 string
 */
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Convert URL-safe base64 string to ArrayBuffer
 * @param {string} base64Url - The URL-safe base64 string
 * @returns {ArrayBuffer} The decoded buffer
 */
function base64UrlToBuffer(base64Url) {
  // Convert URL-safe base64 back to standard base64
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '=';
  }
  
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Encrypt data with a password
 * @param {string} plaintext - The data to encrypt
 * @param {string} password - The password for encryption
 * @returns {Promise<string>} URL-safe encrypted string (salt:iv:ciphertext)
 */
export async function encrypt(plaintext, password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Encrypt the data
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );
  
  // Combine salt, iv, and ciphertext into single string
  const saltB64 = bufferToBase64Url(salt.buffer);
  const ivB64 = bufferToBase64Url(iv.buffer);
  const ciphertextB64 = bufferToBase64Url(ciphertext);
  
  return `${saltB64}.${ivB64}.${ciphertextB64}`;
}

/**
 * Decrypt data with a password
 * @param {string} encryptedData - The encrypted string (salt.iv.ciphertext)
 * @param {string} password - The password for decryption
 * @returns {Promise<string>} The decrypted plaintext
 * @throws {Error} If decryption fails (wrong password or corrupted data)
 */
export async function decrypt(encryptedData, password) {
  const parts = encryptedData.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }
  
  const [saltB64, ivB64, ciphertextB64] = parts;
  
  // Convert from base64
  const salt = new Uint8Array(base64UrlToBuffer(saltB64));
  const iv = new Uint8Array(base64UrlToBuffer(ivB64));
  const ciphertext = base64UrlToBuffer(ciphertextB64);
  
  // Derive key from password
  const key = await deriveKey(password, salt);
  
  // Decrypt the data
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    ciphertext
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Check if a string appears to be encrypted (has the salt.iv.ciphertext format)
 * @param {string} data - The string to check
 * @returns {boolean} True if the string appears to be encrypted
 */
export function isEncrypted(data) {
  if (!data) return false;
  const parts = data.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
}
