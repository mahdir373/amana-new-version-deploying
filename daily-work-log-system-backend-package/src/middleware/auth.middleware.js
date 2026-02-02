const jwt = require('jsonwebtoken');
const authConfig = require('../config/auth.config');
const User = require('../models/user.model');

// Verify JWT token
exports.verifyToken = (req, res, next) => {
  // Get token from Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'No token provided'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify token
    const decoded = jwt.verify(token, authConfig.secret);
    
    // Add user ID to request object
    req.userId = decoded.id;
    req.userRole = decoded.role;
    
    next();
  } catch (error) {
    return res.status(401).json({
      message: 'Unauthorized - Invalid token'
    });
  }
};

// Check if user is a Manager
exports.isManager = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      if (user.role !== 'Manager') {
        return res.status(403).json({
          message: 'Require Manager Role'
        });
      }

      next();
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role'
      });
    });
};

// Check if user is a Team Leader
exports.isTeamLeader = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      if (user.role !== 'Team Leader') {
        return res.status(403).json({
          message: 'Require Team Leader Role'
        });
      }

      next();
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role'
      });
    });
};

// Check if user is either a Manager or Team Leader
exports.isManagerOrTeamLeader = (req, res, next) => {
  User.findById(req.userId)
    .then(user => {
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }

      if (user.role !== 'Manager' && user.role !== 'Team Leader') {
        return res.status(403).json({
          message: 'Require Manager or Team Leader Role'
        });
      }

      next();
    })
    .catch(err => {
      res.status(500).json({
        message: err.message || 'Error checking user role'
      });
    });
};
