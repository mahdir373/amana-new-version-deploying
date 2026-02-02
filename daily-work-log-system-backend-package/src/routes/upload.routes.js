const express = require('express');
const uploadController = require('../controllers/upload.controller');
const { verifyToken, isManagerOrTeamLeader } = require('../middleware/auth.middleware');
const { uploadPhotos, uploadDocuments } = require('../middleware/upload.middleware');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Upload photos to a daily log
router.post(
  '/:logId/photos',
  isManagerOrTeamLeader,
  uploadPhotos.array('photos', 10), // Allow up to 10 photos
  uploadController.uploadPhotos
);

// Upload documents to a daily log
router.post(
  '/:logId/documents',
  isManagerOrTeamLeader,
  uploadDocuments.array('documents', 10), // Allow up to 10 documents
  uploadController.uploadDocuments
);

// Delete a file (photo or document)
router.delete(
  '/:logId/:fileType/:fileId',
  isManagerOrTeamLeader,
  uploadController.deleteFile
);

module.exports = router;