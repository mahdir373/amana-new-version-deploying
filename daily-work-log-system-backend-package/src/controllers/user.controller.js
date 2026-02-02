const User = require('../models/user.model');
const { validationResult } = require('express-validator');

// Get all users (managers only)
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving users'
    });
  }
};
// Get users map by a batch of IDs: ?ids=ID1,ID2,ID3  → { "ID1": "Full Name", ... }
exports.getUsersMapByIds = async (req, res) => {
  try {
    const idsParam = (req.query.ids || '').trim();
    if (!idsParam) return res.status(200).json({}); // אין מזהים – מחזירים ריק

    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean);
    if (!ids.length) return res.status(200).json({});

    const users = await User.find({ _id: { $in: ids } })
      .select('_id fullName') // מחזירים רק מה שצריך
      .lean();

    const map = {};
    for (const u of users) map[u._id] = u.fullName;

    return res.status(200).json(map);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving users map'
    });
  }
};

// Get team leaders (for manager dashboard)
exports.getTeamLeaders = async (req, res) => {
  try {
    const teamLeaders = await User.find({ role: 'Team Leader' }).select('-password');
    return res.status(200).json(teamLeaders);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving team leaders'
    });
  }
};

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving the user'
    });
  }
};

// Create a new user (managers only)
exports.createUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
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
      phone: req.body.phone,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    // Save user to database
    const savedUser = await user.save();
    
    // Return user without password
    const userResponse = savedUser.toObject();
    delete userResponse.password;
    
    return res.status(201).json(userResponse);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while creating the user'
    });
  }
};

// Update a user
exports.updateUser = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Check if email is being changed and already exists
    if (req.body.email) {
      const existingUser = await User.findOne({ 
        email: req.body.email,
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already in use'
        });
      }
    }
    
    // Find user and update
    const updateData = {
      fullName: req.body.fullName,
      email: req.body.email,
      role: req.body.role,
      phone: req.body.phone,
      isActive: req.body.isActive
    };
    
    // Only update password if provided
    if (req.body.password) {
      updateData.password = req.body.password;
    }
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while updating the user'
    });
  }
};

// Delete a user (managers only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    return res.status(200).json({
      message: 'User deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while deleting the user'
    });
  }
};

// Toggle user active status (managers only)
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    return res.status(200).json({
      id: user._id,
      isActive: user.isActive,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while updating user status'
    });
  }
};
