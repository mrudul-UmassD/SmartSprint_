const express = require('express');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  async (req, res) => {
    const { name, email, password, role = 'developer' } = req.body;
    
    // Manual validation
    const errors = [];
    if (!name) errors.push({ msg: 'Name is required' });
    if (!email) errors.push({ msg: 'Email is required' });
    if (!email.includes('@')) errors.push({ msg: 'Please include a valid email' });
    if (!password) errors.push({ msg: 'Password is required' });
    if (password && password.length < 6) errors.push({ msg: 'Password must be at least 6 characters' });
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      // Check if user exists
      let user = await User.findByEmail(email);

      if (user) {
        return res.status(400).json({
          success: false,
          errors: [{ msg: 'User already exists' }]
        });
      }

      // Create user
      const result = await User.create(name, email, password, role);
      
      // Get the newly created user
      user = await User.findById(result.id);

      // Generate token
      const token = generateToken(user);

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Error in register:', err.message);
      res.status(500).json({
        success: false,
        errors: [{ msg: 'Server error' }]
      });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  async (req, res) => {
    const { email, password } = req.body;
    
    // Manual validation
    const errors = [];
    if (!email) errors.push({ msg: 'Email or username is required' });
    if (!password) errors.push({ msg: 'Password is required' });
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    try {
      // Find user by email or username (treating email field as either)
      let user = await User.findByEmail(email);
      
      // If not found by email, try finding by username
      if (!user) {
        // This handles the case where admin might use "admin" as username
        user = await User.findByUsername(email);
      }

      if (!user) {
        return res.status(400).json({
          success: false,
          errors: [{ msg: 'Invalid credentials' }]
        });
      }

      // Check password
      const isMatch = await user.comparePassword(password);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          errors: [{ msg: 'Invalid credentials' }]
        });
      }

      // Generate token
      const token = generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (err) {
      console.error('Error in login:', err.message);
      res.status(500).json({
        success: false,
        errors: [{ msg: 'Server error' }]
      });
    }
  }
);

// @route   GET /api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error in get user:', err.message);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 