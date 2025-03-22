const express = require('express');
const User = require('../models/User');
const { authMiddleware, roleCheck } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin & Project Manager only)
router.get('/', authMiddleware, roleCheck('admin', 'project_manager'), async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin & Project Manager only, or own user)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    // Check if user is requesting their own data or has proper permissions
    if (req.userId !== parseInt(req.params.id, 10) && 
        !['admin', 'project_manager'].includes(req.userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - you can only view your own user data'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Don't send the password
    const { password, ...userData } = user;
    
    res.json({ success: true, user: userData });
  } catch (err) {
    console.error('Error fetching user:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   POST /api/users
// @desc    Create a new user (with role restrictions)
// @access  Private (Admin & Project Manager only)
router.post('/', authMiddleware, roleCheck('admin', 'project_manager'), async (req, res) => {
  try {
    const { name, email, password, role = 'developer' } = req.body;
    
    // Manual validation
    const errors = [];
    if (!name) errors.push('Name is required');
    if (!email) errors.push('Email is required');
    if (!email.includes('@')) errors.push('Please include a valid email');
    if (!password) errors.push('Password is required');
    if (password && password.length < 6) errors.push('Password must be at least 6 characters');
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    
    // Check if email is already in use
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already in use' });
    }
    
    // Create user with role check
    const result = await User.createByUser(req.userRole, name, email, password, role);
    
    // Get the newly created user
    const user = await User.findById(result.id);
    
    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Error creating user:', err.message);
    
    // Handle permission errors
    if (err.message && err.message.includes('cannot create users with role')) {
      return res.status(403).json({ success: false, message: err.message });
    }
    
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/change-password
// @desc    Change user password
// @access  Private (own user only)
router.put('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Manual validation
    const errors = [];
    if (!currentPassword) errors.push('Current password is required');
    if (!newPassword) errors.push('New password is required');
    if (newPassword && newPassword.length < 6) errors.push('New password must be at least 6 characters');
    
    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(', ') });
    }
    
    // Get user
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    
    // Update password
    await User.updatePassword(req.userId, newPassword);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own user only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    
    // Check if user is updating their own data or is an admin
    if (req.userId !== userId && req.userRole !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied - you can only update your own user data'
      });
    }
    
    const { name, email, role } = req.body;
    const updateData = {};
    
    // Only admins can change roles
    if (role && req.userRole === 'admin') {
      updateData.role = role;
    }
    
    // Anyone can update their own name and email
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    // Update user
    const result = await User.update(userId, updateData);
    
    // Get the updated user
    const user = await User.findById(userId);
    
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
    console.error('Error updating user:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const result = await User.delete(req.params.id);
    
    if (!result.success) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router; 