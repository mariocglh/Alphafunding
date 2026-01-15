const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth'); // Tu autenticación normal
const isAdmin = require('../middleware/isAdmin'); // La seguridad nueva

// Protegemos la ruta con DOBLE llave: primero debe estar logueado (auth), luego ser admin (isAdmin)
router.get('/god-mode', auth, isAdmin, adminController.getAllData);

module.exports = router;