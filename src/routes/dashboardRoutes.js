const express = require('express');
const router = express.Router();
const { getDashboardStats, clearAllDemoData } = require('../controllers/dashboardController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/', protect, adminOnly, getDashboardStats);
router.delete('/clear-demo-data', protect, adminOnly, clearAllDemoData);
router.post('/clear-demo-data', protect, adminOnly, clearAllDemoData);

module.exports = router;
