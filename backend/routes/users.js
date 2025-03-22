const express = require('express');
const User = require('../models/User');
const { authMiddleware, roleCheck } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Private (project managers)
router.get('/', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
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
    
    // Allow project managers to access any user, but developers only their own
    if (req.userRole !== 'project_manager' && req.userId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this user'
      });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: user.toJSON()
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

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Allow project managers to update any user, but developers only their own
    if (req.userRole !== 'project_manager' && req.userId !== parseInt(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this user'
      });
    }
    
    const { name, email, role } = req.body;
    
    // Build update object
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    // Only project managers can change roles
    if (role && req.userRole === 'project_manager') {
      updates.role = role;
    }
    
    const result = await User.update(userId, updates);
    
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        message: 'User not found or no changes made'
      });
    }
    
    // Get updated user
    const user = await User.findById(userId);
    
    return res.status(200).json({
      success: true,
      data: user.toJSON()
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

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (project managers)
router.delete('/:id', authMiddleware, roleCheck(['project_manager']), async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent project manager from deleting themselves
    if (req.userId === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }
    
    const result = await User.delete(userId);
    
    if (!result.changes) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
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