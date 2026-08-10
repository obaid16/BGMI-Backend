const express = require('express');
const router = express.Router();
const { 
  getMediaList, 
  createMedia, 
  verifyMedia, 
  publishMedia, 
  deleteMedia 
} = require('../controllers/mediaController');
const { upload } = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getMediaList);
router.post('/', upload.single('file'), createMedia); // Supports file uploading under key 'file'

// Admin-only routes
router.put('/:id/verify', protect, adminOnly, verifyMedia);
router.put('/:id/publish', protect, adminOnly, publishMedia);
router.delete('/:id', protect, adminOnly, deleteMedia);

module.exports = router;
