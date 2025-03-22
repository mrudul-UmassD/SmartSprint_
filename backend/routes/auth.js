const express = require('express');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, role = 'developer' } = req.body;

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
  [
    check('email', 'Email or username is required').exists(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

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
        errors: [{ msg: 'User not found' }]
      });
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        department: user.department,
        location: user.location,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Error in get user:', err.message);
    res.status(500).json({
      success: false,
      errors: [{ msg: 'Server error' }]
    });
  }
});

module.exports = router; 