const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Add user ID to request
    req.userId = decoded.userId;
    
    // Get user role from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found'
      });
    }
    
    // Add user role to request
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Role-based access control middleware
// Accepts multiple roles as arguments
const roleCheck = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(500).json({
        success: false,
        message: 'Server error - role not set'
      });
    }
    
    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient permissions'
      });
    }
    
    next();
  };
};

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

module.exports = {
  authMiddleware,
  roleCheck,
  generateToken
}; 