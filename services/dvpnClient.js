// DVPN Client Service
// Handles sending encrypted payloads to Toronto and Halifax nodes

const axios = require('axios');
const { encryptAES } = require('./encryptionService');

const TORONTO_URL = process.env.TORONTO_URL || 'http://localhost:4001';
const HALIFAX_URL = process.env.HALIFAX_URL || 'http://localhost:4002';

/**
 * Send encrypted data to Toronto Node
 * Toronto will forward it to Halifax for decryption
 * @param {any} payload - The data to encrypt and send
 * @returns {object} - Response from Halifax Node
 */
const sendToToronto = async (payload) => {
  try {
    // Convert payload to JSON string
    const payloadString = JSON.stringify(payload);
    
    // Encrypt the payload
    const encrypted = encryptAES(payloadString);
    
    console.log(`[Client] Encrypting payload and sending to Toronto: ${TORONTO_URL}`);
    
    // Send to Toronto Node
    const response = await axios.post(`${TORONTO_URL}/receive`, {
      encryptedData: encrypted
    }, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending to Toronto:', error.message);
    throw new Error(`Failed to send to Toronto Node: ${error.message}`);
  }
};

/**
 * Send encrypted data directly to Halifax Node (for testing)
 * @param {any} payload - The data to encrypt and send
 * @returns {object} - Response from Halifax Node
 */
const sendToHalifax = async (payload) => {
  try {
    // Convert payload to JSON string
    const payloadString = JSON.stringify(payload);
    
    // Encrypt the payload
    const encrypted = encryptAES(payloadString);
    
    console.log(`[Client] Encrypting payload and sending to Halifax: ${HALIFAX_URL}`);
    
    // Send to Halifax Node
    const response = await axios.post(`${HALIFAX_URL}/decrypt`, {
      encryptedData: encrypted
    }, {
      timeout: 5000
    });
    
    return response.data;
  } catch (error) {
    console.error('Error sending to Halifax:', error.message);
    throw new Error(`Failed to send to Halifax Node: ${error.message}`);
  }
};

module.exports = {
  sendToToronto,
  sendToHalifax
};
