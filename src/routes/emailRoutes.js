const express = require('express');
const router = express.Router();
const { testEmailEndpoint } = require('../controllers/emailController');

// POST /api/email/test
router.post('/test', testEmailEndpoint);

module.exports = router;
