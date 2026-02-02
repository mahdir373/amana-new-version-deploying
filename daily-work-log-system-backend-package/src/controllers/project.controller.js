const Project = require('../models/project.model');
const { validationResult } = require('express-validator');

// Get all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find();
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving projects'
    });
  }
};

// Get active projects
exports.getActiveProjects = async (req, res) => {
  try {
    const projects = await Project.find({ isActive: true, status: 'active' });
    return res.status(200).json(projects);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving active projects'
    });
  }
};

// Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }
    
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while retrieving the project'
    });
  }
};

// Create a new project (managers only)
exports.createProject = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Create new project
    const project = new Project({
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      clientName: req.body.clientName,
      clientContact: req.body.clientContact,
      startDate: req.body.startDate,
      estimatedEndDate: req.body.estimatedEndDate,
      status: req.body.status || 'active',
      description: req.body.description,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    });
    
    // Save project to database
    const savedProject = await project.save();
    
    return res.status(201).json(savedProject);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while creating the project'
    });
  }
};

// Update a project (managers only)
exports.updateProject = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    // Find project and update
    const updateData = {
      name: req.body.name,
      address: req.body.address,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      clientName: req.body.clientName,
      clientContact: req.body.clientContact,
      startDate: req.body.startDate,
      estimatedEndDate: req.body.estimatedEndDate,
      actualEndDate: req.body.actualEndDate,
      status: req.body.status,
      description: req.body.description,
      isActive: req.body.isActive
    };
    
    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }
    
    return res.status(200).json(project);
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while updating the project'
    });
  }
};

// Delete a project (managers only)
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }
    
    return res.status(200).json({
      message: 'Project deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while deleting the project'
    });
  }
};

// Toggle project active status (managers only)
exports.toggleProjectStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        message: 'Project not found'
      });
    }
    
    project.isActive = !project.isActive;
    await project.save();
    
    return res.status(200).json({
      id: project._id,
      isActive: project.isActive,
      message: `Project ${project.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || 'Some error occurred while updating project status'
    });
  }
};
