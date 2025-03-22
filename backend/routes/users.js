const express = require('express');
const User = require('../models/User');
const { authMiddleware, roleCheck } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (project managers)
router.get('/', authMiddleware, roleCheck('admin', 'project_manager'), async (req, res) => {
  try {
    const users = await User.findAll();
    
    return res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user is requesting their own data or is an admin
    if (req.userId !== parseInt(userId) && req.userRole !== 'admin' && req.userRole !== 'project_manager') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this user data'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    
    return res.status(200).json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Get user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (admin and project_manager only)
router.post('/', authMiddleware, roleCheck('admin', 'project_manager'), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }
    
    // Check if user with email already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Create user with permission check
    const result = await User.createByUser(
      req.userRole,
      name, 
      email, 
      password, 
      role || 'developer'
    );

    const newUser = await User.findById(result.id);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    // Handle permission errors specifically
    if (error.message && error.message.includes('cannot create users with role')) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;
    
    // Check if user is updating their own data or is an admin
    if (req.userId !== parseInt(userId) && req.userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }
    
    // Don't allow role changes by non-admins
    if (updates.role && req.userRole !== 'admin') {
      delete updates.role;
    }
    
    // Don't allow password updates through this endpoint
    if (updates.password) {
      delete updates.password;
    }
    
    const result = await User.update(userId, updates);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no changes made'
      });
    }
    
    const updatedUser = await User.findById(userId);
    
    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    console.error('Update user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/users/:id/change-password
// @desc    Change user password
// @access  Private
router.post('/:id/change-password', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    const { currentPassword, newPassword } = req.body;
    
    // Check if user is updating their own password
    if (req.userId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to change this user\'s password'
      });
    }
    
    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }
    
    const result = await User.updatePassword(userId, currentPassword, newPassword);
    
    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error.message);
    
    // Handle specific error for incorrect current password
    if (error.message === 'Current password is incorrect') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (project managers)
router.delete('/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Don't allow deleting self
    if (parseInt(userId) === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }
    
    const result = await User.delete(userId);
    
    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router; 