// DVPN Controller
// Handles encrypted data transmission through the DVPN tunnel
// Client → Toronto Node → Halifax Node → back to Client

const { sendToToronto } = require('../services/dvpnClient');
const { decryptAES } = require('../services/encryptionService');

/**
 * Send encrypted data through DVPN tunnel
 * POST /dvpn/send (protected route)
 * 
 * Flow:
 * 1. Client sends plaintext data
 * 2. Encrypt and send to Toronto Node
 * 3. Toronto forwards to Halifax Node
 * 4. Halifax decrypts and returns plaintext
 * 5. Return to client
 */
const sendThroughDVPN = async (req, res) => {
  try {
    const { data } = req.body;
    const user = req.user; // From auth middleware
    
    // Validate input
    if (!data) {
      return res.status(400).json({
        success: false,
        message: 'Data field required in request body'
      });
    }
    
    console.log(`[DVPN] User ${user.username} sending data through tunnel...`);
    
    // Send encrypted data through Toronto Node
    // Toronto will forward to Halifax and return the decrypted response
    const response = await sendToToronto({
      data,
      sender: user.username,
      timestamp: new Date().toISOString()
    });
    
    console.log(`[DVPN] Response received from Halifax`);
    
    res.json({
      success: true,
      message: 'Data transmitted through DVPN successfully',
      originalData: data,
      fromHalifax: response
    });
  } catch (error) {
    console.error('DVPN send error:', error.message);
    res.status(500).json({
      success: false,
      message: `Failed to send through DVPN: ${error.message}`
    });
  }
};

module.exports = {
  sendThroughDVPN
};
