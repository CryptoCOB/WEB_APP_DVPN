// User Controller
// Handles user registration, login, and CRUD operations

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Register a new user
 * POST /register
 */
const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already taken'
      });
    }
    
    // Create new user (password will be hashed by User model)
    const newUser = new User({
      username,
      password
    });
    
    await newUser.save();
    
    console.log(`[User] New user registered: ${username}`);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

/**
 * Login user and return JWT
 * POST /login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }
    
    // Find user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Compare passwords
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your_secret_key_change_this_in_production',
      { expiresIn: '24h' }
    );
    
    console.log(`[User] User logged in: ${username}`);
    
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

/**
 * Get all users
 * GET /users
 */
const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
};

/**
 * Update user by ID
 * PUT /users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password } = req.body;
    
    // Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update fields if provided
    if (username) {
      // Check if new username is already taken
      const existingUser = await User.findOne({ username, _id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already taken'
        });
      }
      user.username = username;
    }
    
    if (password) {
      user.password = password; // Will be hashed by User model
    }
    
    await user.save();
    
    console.log(`[User] User updated: ${id}`);
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
};

/**
 * Delete user by ID
 * DELETE /users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete user
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    console.log(`[User] User deleted: ${id}`);
    
    res.json({
      success: true,
      message: 'User deleted successfully',
      user: {
        id: user._id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
};

module.exports = {
  register,
  login,
  getUsers,
  updateUser,
  deleteUser
};
