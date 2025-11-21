// User Routes
// Defines endpoints for user registration, login, and CRUD operations

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');

/**
 * POST /register
 * Register a new user
 * Body: { username: string, password: string }
 */
router.post('/register', userController.register);

/**
 * POST /login
 * Login user and receive JWT token
 * Body: { username: string, password: string }
 * Returns: { token: string, user: object }
 */
router.post('/login', userController.login);

/**
 * GET /users
 * Get all users (public endpoint)
 */
router.get('/', userController.getUsers);

/**
 * PUT /users/:id
 * Update user by ID (protected - requires JWT)
 * Body: { username?: string, password?: string }
 */
router.put('/:id', authMiddleware, userController.updateUser);

/**
 * DELETE /users/:id
 * Delete user by ID (protected - requires JWT)
 */
router.delete('/:id', authMiddleware, userController.deleteUser);

module.exports = router;
