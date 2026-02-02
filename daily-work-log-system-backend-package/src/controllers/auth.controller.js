const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const authConfig = require('../config/auth.config');

// Register a new user
exports.register = async (req, res) => {
  try {
    // Check if email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({
        message: 'Email is already in use'
      });
    }

    // Create new user
    const user = new User({
      fullName: req.body.fullName,
      email: req.body.email,
      password: req.body.password,
      role: req.body.role,
      phone: req.body.phone
    });

    // Save user to database
    await user.save();

    return res.status(201).json({
      message: 'User registered successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while registering the user'
    });
  }
};

// User login
exports.login = async (req, res) => {
  try {
    // Find user by email
    const user = await User.findOne({ email: req.body.email });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        message: 'Account is inactive. Please contact an administrator.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(req.body.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Invalid password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      authConfig.secret,
      { expiresIn: authConfig.expiresIn }
    );

    // Return user info and token
    return res.status(200).json({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      token: token
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred during login'
    });
  }
};

// Get current user profile
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving user profile'
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(req.body.currentPassword);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = req.body.newPassword;
    await user.save();

    return res.status(200).json({
      message: 'Password changed successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while changing password'
    });
  }
};
