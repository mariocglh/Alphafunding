const express = require('express');
const router = express.Router();

// IMPORTACIONES
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/auth'); 
const isAdmin = require('../middleware/isAdmin');

// 🕵️‍♂️ DETECTIVE DE AUTH: Arregla 'auth' si no es una función
let finalAuth = authMiddleware;

// Si 'auth' NO es una función, buscamos la función dentro
if (typeof finalAuth !== 'function') {
    console.log("⚠️ AVISO: El middleware 'auth' es un Objeto, buscando la función dentro...");
    
    // 🔥 AQUÍ ESTÁ EL ARREGLO: Buscamos 'authenticateToken' primero
    if (typeof finalAuth.authenticateToken === 'function') {
        finalAuth = finalAuth.authenticateToken;
        console.log("✅ Encontrada función: auth.authenticateToken");
    } else if (typeof finalAuth.verifyToken === 'function') {
        finalAuth = finalAuth.verifyToken;
        console.log("✅ Encontrada función: auth.verifyToken");
    } else if (typeof finalAuth.authenticate === 'function') {
        finalAuth = finalAuth.authenticate;
        console.log("✅ Encontrada función: auth.authenticate");
    } else {
        console.log("❌ ERROR CRÍTICO: No encuentro la función de auth. Contenido:", finalAuth);
    }
}

// DIAGNÓSTICO FINAL
console.log("🔧 ESTADO DE LA RUTA ADMIN:");
console.log("- Auth es función?:", typeof finalAuth === 'function' ? '✅ SÍ' : '❌ NO');
console.log("- IsAdmin es función?:", typeof isAdmin === 'function' ? '✅ SÍ' : '❌ NO');
console.log("- Controller es función?:", typeof adminController.getAllData === 'function' ? '✅ SÍ' : '❌ NO');
// Verificamos si existe la función de banear (para evitar sustos)
console.log("- Ban Function es función?:", typeof adminController.banUser === 'function' ? '✅ SÍ' : '❌ NO (Revisa adminController)');

// LA RUTA PRINCIPAL
router.get('/god-mode', finalAuth, isAdmin, adminController.getAllData);

// 🔥 NUEVA RUTA: PARA ELIMINAR USUARIOS (BANEAR)
router.delete('/ban/:id', finalAuth, isAdmin, adminController.banUser);

module.exports = router;