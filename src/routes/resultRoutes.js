const express = require('express');
const router = express.Router();
const { 
  getResults, 
  getResultById, 
  submitResult, 
  deleteResult 
} = require('../controllers/resultController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getResults);
router.get('/:id', getResultById);

// Admin-only routes
router.post('/', protect, adminOnly, submitResult);
router.delete('/:id', protect, adminOnly, deleteResult);

module.exports = router;
