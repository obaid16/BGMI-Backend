const express = require('express');
const router = express.Router();
const { 
  registerTeam, 
  getTeams, 
  getTeamById, 
  updateTeamStatus, 
  createTeam, 
  updateTeam, 
  deleteTeam,
  bulkDeleteTeams
} = require('../controllers/teamController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', registerTeam);
router.get('/', getTeams);
router.get('/:id', getTeamById);

// Admin-only endpoints
router.post('/bulk-delete', protect, adminOnly, bulkDeleteTeams);
router.post('/', protect, adminOnly, createTeam);
router.put('/:id', protect, adminOnly, updateTeam);
router.delete('/:id', protect, adminOnly, deleteTeam);
router.put('/:id/status', protect, adminOnly, updateTeamStatus);

module.exports = router;
