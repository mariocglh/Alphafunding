const express = require('express');
const router = express.Router();
const tradeController = require('../controllers/tradeController');

// 🔥 IMPORTANTE: Sacamos authenticateToken y tradeLimiter con llaves { }
const { authenticateToken, tradeLimiter } = require('../middleware/auth');

// POST /place-trade -> Auth -> Limiter -> Controller
router.post('/place-trade', authenticateToken, tradeLimiter, tradeController.placeTrade);

// POST /close-trade -> Auth -> Controller
router.post('/close-trade', authenticateToken, tradeController.closeTrade);

module.exports = router;