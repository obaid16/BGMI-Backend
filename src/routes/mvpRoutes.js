const express = require('express');
const router = express.Router();
const { getMVP } = require('../controllers/playerController');

// GET /api/mvp - Returns tournament MVP fragger and fraggers list
router.get('/', getMVP);

module.exports = router;
