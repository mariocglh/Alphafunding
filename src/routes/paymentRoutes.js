const express = require('express');
const router = express.Router();

// Importamos el controlador entero
const paymentController = require('../controllers/paymentController');

// Creamos la ruta apuntando a la función exacta
router.post('/create-checkout-session', paymentController.createCheckoutSession);

module.exports = router;