const express = require('express');
const router = express.Router();
const { 
  getMediaList, 
  createMedia, 
  verifyMedia, 
  publishMedia, 
  deleteMedia,
  bulkDeleteMedia 
} = require('../controllers/mediaController');
const { upload } = require('../middleware/uploadMiddleware');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Flexible upload middleware supporting 'file', 'mediaFile', or any single upload field
const handleMediaUpload = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      console.error('[Media Upload Error]', err);
      return res.status(400).json({ success: false, message: err.message || 'File upload error' });
    }
    if (req.files && req.files.length > 0) {
      req.file = req.files.find(f => f.fieldname === 'file' || f.fieldname === 'mediaFile') || req.files[0];
    }
    next();
  });
};

// Public routes
router.get('/', getMediaList);
router.post('/', handleMediaUpload, createMedia); // Supports file uploading under 'file', 'mediaFile', or any key

// Admin-only routes
router.post('/bulk-delete', protect, adminOnly, bulkDeleteMedia);
router.delete('/bulk', protect, adminOnly, bulkDeleteMedia);
router.put('/:id/verify', protect, adminOnly, verifyMedia);
router.put('/:id/publish', protect, adminOnly, publishMedia);
router.delete('/:id', protect, adminOnly, deleteMedia);

module.exports = router;
