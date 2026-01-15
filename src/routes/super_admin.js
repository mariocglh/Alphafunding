const express = require('express');
const router = express.Router();

// IMPORTACIONES
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');

// DIAGNÓSTICO EN CONSOLA (Para ver si carga bien)
console.log("🔧 CARGANDO RUTA ADMIN:");
console.log("- Auth Middleware:", !!auth);
console.log("- IsAdmin Middleware:", !!isAdmin);
console.log("- Controller:", !!adminController);
console.log("- Controller Function:", !!adminController?.getAllData);

// LA RUTA
router.get('/god-mode', auth, isAdmin, adminController.getAllData);

module.exports = router;