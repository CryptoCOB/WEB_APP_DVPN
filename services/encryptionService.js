// Encryption Service
// Provides AES-256-CBC encryption and decryption functions
// Uses Node.js built-in crypto module

const crypto = require('crypto');

// Get encryption key and IV from environment variables
// Key must be 32 bytes for AES-256, IV must be 16 bytes
const AES_KEY = Buffer.from(process.env.AES_KEY || '0123456789abcdef0123456789abcdef', 'utf8');
const AES_IV = Buffer.from(process.env.AES_IV || 'fedcba9876543210', 'utf8');

/**
 * Encrypt plaintext using AES-256-CBC
 * @param {string} plaintext - The data to encrypt
 * @returns {string} - Base64 encoded ciphertext
 */
const encryptAES = (plaintext) => {
  try {
    // Create cipher using AES-256-CBC algorithm
    const cipher = crypto.createCipheriv('aes-256-cbc', AES_KEY, AES_IV);
    
    // Update cipher with plaintext
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Return as Base64 for easy transmission
    return Buffer.from(encrypted, 'hex').toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Encryption failed');
  }
};

/**
 * Decrypt ciphertext using AES-256-CBC
 * @param {string} ciphertext - The Base64 encoded ciphertext to decrypt
 * @returns {string} - Decrypted plaintext
 */
const decryptAES = (ciphertext) => {
  try {
    // Convert Base64 back to hex
    const encryptedBuffer = Buffer.from(ciphertext, 'base64');
    const encrypted = encryptedBuffer.toString('hex');
    
    // Create decipher using AES-256-CBC algorithm
    const decipher = crypto.createDecipheriv('aes-256-cbc', AES_KEY, AES_IV);
    
    // Update decipher with encrypted data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Decryption failed');
  }
};

module.exports = {
  encryptAES,
  decryptAES
};
