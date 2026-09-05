const express = require('express');
const router = express.Router();
const { 
  getMatches, 
  getMatchById, 
  createMatch, 
  updateMatch, 
  updateMatchStatus, 
  deleteMatch,
  bulkDeleteMatches 
} = require('../controllers/matchController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getMatches);
router.get('/:id', getMatchById);

// Admin-only routes
router.post('/', protect, adminOnly, createMatch);
router.post('/bulk-delete', protect, adminOnly, bulkDeleteMatches);
router.delete('/bulk', protect, adminOnly, bulkDeleteMatches);
router.put('/:id', protect, adminOnly, updateMatch);
router.put('/:id/status', protect, adminOnly, updateMatchStatus);
router.delete('/:id', protect, adminOnly, deleteMatch);

module.exports = router;
