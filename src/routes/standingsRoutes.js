const express = require('express');
const router = express.Router();
const { getLeaderboard, getScoringConfig } = require('../controllers/standingsController');

router.get('/', getLeaderboard);
router.get('/rules', getScoringConfig);

module.exports = router;
