const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { runScraper } = require('../controllers/scraperControllers');

router.post('/run', protect, runScraper);

module.exports = router;