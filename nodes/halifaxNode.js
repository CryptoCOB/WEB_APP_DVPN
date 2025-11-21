// Halifax Node
// Receives encrypted data and decrypts it
// The final destination in the DVPN tunnel

const express = require('express');
const cors = require('cors');
const { decryptAES } = require('../services/encryptionService');

const app = express();
const PORT = 4002;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * POST /decrypt
 * Decrypt encrypted data
 * This is the final destination where data is decrypted
 * 
 * Body: { encryptedData: string }
 * Returns: { from: "halifax", decrypted: <original_plaintext> }
 */
app.post('/decrypt', async (req, res) => {
  try {
    const { encryptedData } = req.body;
    
    // Validate input
    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted data required'
      });
    }
    
    console.log('[Halifax] Received encrypted data');
    
    // Decrypt the data
    const decrypted = decryptAES(encryptedData);
    
    console.log('[Halifax] Data decrypted successfully');
    
    // Parse decrypted JSON
    let decryptedData;
    try {
      decryptedData = JSON.parse(decrypted);
    } catch (e) {
      decryptedData = decrypted; // Return as string if not JSON
    }
    
    // Return decrypted data
    res.json({
      from: 'halifax',
      decrypted: decryptedData,
      success: true
    });
  } catch (error) {
    console.error('[Halifax] Decryption error:', error.message);
    res.status(500).json({
      success: false,
      message: `Decryption failed: ${error.message}`
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'Halifax Node is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  HALIFAX NODE - Running on port ${PORT}   ║
║  Decryption endpoint in DVPN tunnel    ║
╚════════════════════════════════════════╝
  `);
});
