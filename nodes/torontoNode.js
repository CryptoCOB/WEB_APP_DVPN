// Toronto Node
// Receives encrypted data from client and forwards to Halifax Node
// Acts as a relay between client and Halifax

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 4001;

// Middleware
app.use(cors());
app.use(express.json());

const HALIFAX_URL = process.env.HALIFAX_URL || 'http://localhost:4002';

/**
 * POST /receive
 * Receive encrypted data and forward to Halifax Node
 * 
 * Body: { encryptedData: string }
 * Returns: { from: "halifax", decrypted: string }
 */
app.post('/receive', async (req, res) => {
  try {
    const { encryptedData } = req.body;
    
    // Validate input
    if (!encryptedData) {
      return res.status(400).json({
        success: false,
        message: 'Encrypted data required'
      });
    }
    
    console.log('[Toronto] Received encrypted data from client');
    console.log(`[Toronto] Forwarding to Halifax Node: ${HALIFAX_URL}`);
    
    // Forward encrypted data to Halifax Node
    const response = await axios.post(`${HALIFAX_URL}/decrypt`, {
      encryptedData: encryptedData
    }, {
      timeout: 5000
    });
    
    console.log('[Toronto] Response received from Halifax, sending to client');
    
    // Return Halifax's response to the client
    res.json(response.data);
  } catch (error) {
    console.error('[Toronto] Error:', error.message);
    res.status(500).json({
      success: false,
      message: `Error processing request: ${error.message}`
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'Toronto Node is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  TORONTO NODE - Running on port ${PORT}   ║
║  Relay between Client and Halifax      ║
╚════════════════════════════════════════╝
  `);
});
