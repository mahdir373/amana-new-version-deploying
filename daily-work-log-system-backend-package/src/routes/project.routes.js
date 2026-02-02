const express = require('express');
const { body, validationResult } = require('express-validator');
const projectController = require('../controllers/project.controller');
const { verifyToken, isManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all projects
router.get('/', projectController.getAllProjects);

// Get active projects
router.get('/active', projectController.getActiveProjects);

// Get project by ID
router.get('/:id', projectController.getProjectById);

// Create a new project (managers only)
router.post(
  '/',
  isManager,
  [
    // Validation rules
    body('name').notEmpty().withMessage('Project name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('city').notEmpty().withMessage('City is required'),
    body('state').notEmpty().withMessage('State is required'),
    body('zipCode').notEmpty().withMessage('Zip code is required'),
    body('startDate').isISO8601().withMessage('Valid start date is required')
  ],
  projectController.createProject
);

// Update a project (managers only)
router.put(
  '/:id',
  isManager,
  [
    // Validation rules (optional fields for update)
    body('name').optional().notEmpty().withMessage('Project name cannot be empty'),
    body('address').optional().notEmpty().withMessage('Address cannot be empty'),
    body('city').optional().notEmpty().withMessage('City cannot be empty'),
    body('state').optional().notEmpty().withMessage('State cannot be empty'),
    body('zipCode').optional().notEmpty().withMessage('Zip code cannot be empty'),
    body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
    body('estimatedEndDate').optional().isISO8601().withMessage('Valid estimated end date is required'),
    body('actualEndDate').optional().isISO8601().withMessage('Valid actual end date is required'),
    body('status').optional().isIn(['active', 'completed', 'on-hold', 'cancelled']).withMessage('Invalid status value')
  ],
  projectController.updateProject
);

// Delete a project (managers only)
router.delete('/:id', isManager, projectController.deleteProject);

// Toggle project active status (managers only)
router.patch('/:id/toggle-status', isManager, projectController.toggleProjectStatus);

module.exports = router;
