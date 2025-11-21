// DVPN Routes
// Defines endpoints for encrypted data transmission through the DVPN tunnel

const express = require('express');
const router = express.Router();
const dvpnController = require('../controllers/dvpnController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /dvpn/send
 * Send encrypted data through DVPN tunnel
 * Protected route - requires JWT in Authorization header
 * 
 * Headers: Authorization: Bearer <JWT_TOKEN>
 * Body: { data: string }
 * 
 * Flow:
 * 1. Client encrypts data and sends to this endpoint
 * 2. Toronto Node receives and forwards to Halifax
 * 3. Halifax Node decrypts and returns plaintext
 * 4. Response sent back to client
 */
router.post('/send', authMiddleware, dvpnController.sendThroughDVPN);

module.exports = router;
