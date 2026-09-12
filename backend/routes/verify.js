const express = require('express');
const router = express.Router();
const VerifyController = require('../controllers/verifyController');

// @route   GET /api/verify/:hash
router.get('/:hash', VerifyController.verifyDocument);

module.exports = router;
