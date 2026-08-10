const express = require('express');
const router = express.Router();
const { 
  getRules, 
  createRule, 
  updateRule, 
  deleteRule 
} = require('../controllers/ruleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getRules);

// Admin-only routes
router.post('/', protect, adminOnly, createRule);
router.put('/:id', protect, adminOnly, updateRule);
router.delete('/:id', protect, adminOnly, deleteRule);

module.exports = router;
