const express = require('express');
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken, isManager } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all users (managers only)
router.get('/', isManager, userController.getAllUsers);

// Get team leaders (for manager dashboard)
router.get('/team-leaders', isManager, userController.getTeamLeaders);

// Get user by ID
router.get('/:id', userController.getUserById);

router.get('/by-ids', verifyToken, userController.getUsersMapByIds);

// Create a new user (managers only)
router.post(
  '/',
  isManager,
  [
    // Validation rules
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .isIn(['Manager', 'Team Leader'])
      .withMessage('Role must be either Manager or Team Leader')
  ],
  userController.createUser
);

// Update a user (managers only)
router.put(
  '/:id',
  isManager,
  [
    // Validation rules (optional fields for update)
    body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long'),
    body('role')
      .optional()
      .isIn(['Manager', 'Team Leader'])
      .withMessage('Role must be either Manager or Team Leader')
  ],
  userController.updateUser
);

// Delete a user (managers only)
router.delete('/:id', isManager, userController.deleteUser);

// Toggle user active status (managers only)
router.patch('/:id/toggle-status', isManager, userController.toggleUserStatus);

module.exports = router;
