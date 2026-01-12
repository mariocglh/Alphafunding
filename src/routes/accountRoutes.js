const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');

// 🔥 IMPORTANTE: Usamos llaves { } porque tu auth.js exporta varias cosas
const { authenticateToken } = require('../middleware/auth'); 

// Rutas GET
router.get('/dashboard/:userId', authenticateToken, accountController.getDashboard);
router.get('/plans', accountController.getPlans);
router.get('/account-analysis/:accountId', authenticateToken, accountController.getAnalysis);

// Rutas POST
router.post('/create-account', accountController.createAccount);
router.post('/check-risk', accountController.checkRisk);
router.post('/evaluate-account', accountController.evaluateAccount);
router.post('/claim-funded', authenticateToken, accountController.claimFunded);

// Rutas de Gestión
router.post('/delete-account', authenticateToken, accountController.deleteAccount);
router.post('/merge-accounts', authenticateToken, accountController.mergeAccounts);

module.exports = router;