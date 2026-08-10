const express = require('express');
const router = express.Router();
const { 
  getAnnouncements, 
  createAnnouncement, 
  updateAnnouncement, 
  deleteAnnouncement 
} = require('../controllers/announcementController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getAnnouncements);

// Admin-only routes
router.post('/', protect, adminOnly, createAnnouncement);
router.put('/:id', protect, adminOnly, updateAnnouncement);
router.delete('/:id', protect, adminOnly, deleteAnnouncement);

module.exports = router;
