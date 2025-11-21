// Authentication Middleware
// Verifies JWT token from Authorization header and attaches user to request

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify JWT token
 * Expects Authorization header in format: "Bearer <token>"
 * Attaches decoded user data to req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // Get Authorization header
    const authHeader = req.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }
    
    // Extract token from "Bearer <token>" format
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing from Authorization header'
      });
    }
    
    // Verify token using JWT secret
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key_change_this_in_production');
    
    // Attach user data to request object
    req.user = decoded;
    
    console.log(`[Auth] User authenticated: ${decoded.username}`);
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    
    // Invalid or expired token
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

module.exports = authMiddleware;
