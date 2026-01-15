const express = require('express');
const router = express.Router();

// IMPORTACIONES
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth'); // Lo llamamos genérico para investigar
const isAdmin = require('../middleware/isAdmin');

// 🕵️‍♂️ DETECTIVE DE AUTH: Arregla 'auth' si no es una función
let finalAuth = authMiddleware;

// Si 'auth' NO es una función, buscamos la función dentro
if (typeof finalAuth !== 'function') {
    console.log("⚠️ AVISO: El middleware 'auth' es un Objeto, buscando la función dentro...");
    // Probamos nombres comunes de funciones de auth
    if (typeof finalAuth.verifyToken === 'function') {
        finalAuth = finalAuth.verifyToken;
        console.log("✅ Encontrada función: auth.verifyToken");
    } else if (typeof finalAuth.authenticate === 'function') {
        finalAuth = finalAuth.authenticate;
        console.log("✅ Encontrada función: auth.authenticate");
    } else if (typeof finalAuth.checkAuth === 'function') {
        finalAuth = finalAuth.checkAuth;
        console.log("✅ Encontrada función: auth.checkAuth");
    } else {
        // Si no encontramos nada, imprimimos el objeto para ver qué tiene
        console.log("❌ ERROR CRÍTICO: 'auth' no es una función y no encuentro cuál usar. Contenido:", finalAuth);
    }
}

// DIAGNÓSTICO FINAL DE TIPOS (Para que lo veas en el log si falla)
console.log("🔧 ESTADO DE LA RUTA ADMIN:");
console.log("- Auth es función?:", typeof finalAuth === 'function' ? '✅ SÍ' : '❌ NO (' + typeof finalAuth + ')');
console.log("- IsAdmin es función?:", typeof isAdmin === 'function' ? '✅ SÍ' : '❌ NO (' + typeof isAdmin + ')');
console.log("- Controller es función?:", typeof adminController.getAllData === 'function' ? '✅ SÍ' : '❌ NO');

// LA RUTA (Usamos finalAuth que ya está corregido)
router.get('/god-mode', finalAuth, isAdmin, adminController.getAllData);

module.exports = router;