// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Importamos el middleware con llaves { } porque tu auth.js exporta un objeto
const { authenticateToken } = require('../middleware/auth'); 

// Ruta para actualizar perfil (Protegida con Token)
router.post('/update-profile', authenticateToken, userController.updateProfile);

module.exports = router;