const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Definimos las rutas
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;