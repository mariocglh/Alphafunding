const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

// Configuración de Logs
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    defaultMeta: { service: 'auth-middleware' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

const SECRET_KEY = process.env.JWT_SECRET || "mi_clave_secreta_super_segura_alphafunding_2026";

// 👮 AUTENTICACIÓN JWT
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        logger.warn(`⛔ Intento de acceso no autorizado desde IP: ${req.ip}`);
        return res.status(401).json({ error: "Acceso denegado: Falta Token de sesión" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            logger.error(`❌ Token inválido o expirado para IP: ${req.ip}`);
            return res.status(403).json({ error: "Token inválido o expirado" });
        }
        req.user = user;
        next();
    });
}

// 🛑 RATE LIMITER (Anti-Spam)
const tradeLimiter = rateLimit({
    windowMs: 60 * 1000, 
    max: 20, 
    message: { error: "⛔ Demasiadas peticiones. Calma tu trading." },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger.warn(`⚠️ Rate Limit excedido por IP: ${req.ip}`);
        res.status(options.statusCode).send(options.message);
    }
});

module.exports = { authenticateToken, tradeLimiter, SECRET_KEY };