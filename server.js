// Main Server File
// Express application setup with MongoDB connection, middleware, and routes

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import routes
const userRoutes = require('./routes/userRoutes');
const dvpnRoutes = require('./routes/dvpnRoutes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARE
// ==========================================

// Enable CORS
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ==========================================
// DATABASE CONNECTION
// ==========================================

// Connect to MongoDB
connectDB();

// ==========================================
// ROUTES
// ==========================================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// User routes
// POST   /register       - Register new user
// POST   /login          - Login and get JWT
// GET    /users          - Get all users
// PUT    /users/:id      - Update user (protected)
// DELETE /users/:id      - Delete user (protected)
app.use('/users', userRoutes);

// DVPN routes
// POST /dvpn/send        - Send data through encrypted DVPN tunnel (protected)
app.use('/dvpn', dvpnRoutes);

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 error handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  MAIN SERVER - Running on port ${PORT}     ║
║  DVPN Application for COMP229          ║
╚════════════════════════════════════════╝
  `);
  console.log('Available endpoints:');
  console.log('  POST   /users/register           - Register user');
  console.log('  POST   /users/login              - Login');
  console.log('  GET    /users                    - Get all users');
  console.log('  PUT    /users/:id                - Update user');
  console.log('  DELETE /users/:id                - Delete user');
  console.log('  POST   /dvpn/send                - Send through DVPN tunnel');
  console.log('\nMake sure Toronto and Halifax nodes are running!');
  console.log('  npm run toronto  (port 4001)');
  console.log('  npm run halifax  (port 4002)');
});

module.exports = app;
