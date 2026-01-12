// src/utils/priceEngine.js
const axios = require('axios');
const winston = require('winston');

// Logger simple para precios
const logger = winston.createLogger({
    transports: [ new winston.transports.File({ filename: 'logs/combined.log' }) ]
});

const ALLOWED_SYMBOLS = ['BTCUSD', 'ETHUSD', 'EURUSD', 'XAUUSD', 'AAPL', 'NVDA', 'TSLA'];

async function getServerPrice(symbol) {
    if (!ALLOWED_SYMBOLS.includes(symbol)) throw new Error(`Símbolo ${symbol} no permitido.`);

    try {
        // CRIPTO / FOREX (Binance)
        if(['BTCUSD','ETHUSD','EURUSD','XAUUSD'].includes(symbol)) {
            let pair = symbol;
            if (symbol === 'BTCUSD') pair = 'BTCUSDT';
            if (symbol === 'ETHUSD') pair = 'ETHUSDT';
            if (symbol === 'EURUSD') pair = 'EURUSDT';
            if (symbol === 'XAUUSD') pair = 'PAXGUSDT';

            const response = await axios.get(`https://api.binance.com/api/v3/ticker/price?symbol=${pair}`);
            let price = parseFloat(response.data.price);
            
            // Spread simulado
            let volatility = price * 0.0002; 
            let noise = (Math.random() * volatility * 2) - volatility;
            return parseFloat((price + noise).toFixed(2));
        }
    } catch (e) {
        logger.warn(`⚠️ Fallo Binance ${symbol}. Usando simulación.`);
    }

    // ACCIONES (Simulación)
    let basePrice = 100;
    if(symbol === 'AAPL') basePrice = 185.50;
    if(symbol === 'NVDA') basePrice = 720.00;
    if(symbol === 'TSLA') basePrice = 190.00;
    
    let volatility = basePrice * 0.02;
    let noise = (Math.random() * volatility * 2) - volatility;
    
    return parseFloat((basePrice + noise).toFixed(2));
}

module.exports = { getServerPrice, ALLOWED_SYMBOLS };