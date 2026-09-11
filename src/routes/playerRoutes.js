const express = require('express');
const router = express.Router();
const { 
  getPlayers, 
  getPlayerById, 
  verifyPlayer, 
  updatePlayer, 
  deletePlayer,
  bulkDeletePlayers 
} = require('../controllers/playerController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getPlayers);
router.get('/:id', getPlayerById);

// Admin-only routes
router.post('/bulk-delete', protect, adminOnly, bulkDeletePlayers);
router.put('/:id', protect, adminOnly, updatePlayer);
router.put('/:id/verify', protect, adminOnly, verifyPlayer);
router.delete('/:id', protect, adminOnly, deletePlayer);

module.exports = router;
