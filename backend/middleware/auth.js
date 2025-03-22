const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Environment variable for JWT secret (fallback provided for development)
const JWT_SECRET = process.env.JWT_SECRET || 'smartsprint_secret_dev_key';

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'No authentication token provided' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user by ID from token
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    // Attach user data to request
    req.user = user;
    req.userId = user.id;
    req.userRole = user.role;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid authentication token' });
  }
};

// Role-based access control middleware
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.userRole) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    
    if (allowedRoles.includes(req.userRole)) {
      next();
    } else {
      return res.status(403).json({ 
        success: false, 
        message: 'You do not have permission to perform this action' 
      });
    }
  };
};

// Generate JWT token for a user
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

module.exports = {
  authMiddleware,
  roleCheck,
  generateToken
}; 