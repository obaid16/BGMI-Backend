const express = require('express');
const router = express.Router();
const { 
  getRules, 
  createRule, 
  updateRule, 
  deleteRule,
  downloadRulesPdf
} = require('../controllers/ruleController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Public routes
router.get('/', getRules);
router.get('/download', downloadRulesPdf);

// Admin-only routes
router.post('/', protect, adminOnly, createRule);
router.put('/:id', protect, adminOnly, updateRule);
router.delete('/:id', protect, adminOnly, deleteRule);

module.exports = router;
