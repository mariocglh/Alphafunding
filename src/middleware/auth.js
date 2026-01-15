const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const winston = require('winston');

dotenv.config();

// Configuración de Logs (INTACTA)
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
        // Añadimos consola para ver errores en tiempo real en Render
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    ],
});

const SECRET_KEY = process.env.JWT_SECRET || "mi_clave_secreta_super_segura_alphafunding_2026";

// 👮 AUTENTICACIÓN JWT (CON DEBUGGING 🕵️‍♂️)
function authenticateToken(req, res, next) {
    // CHIVATO 1: Ver qué llega en la cabecera
    const authHeader = req.headers['authorization'];
    console.log(`🕵️ AUTH DEBUG: URL ${req.originalUrl} - Header: ${authHeader ? 'PRESENTE' : 'AUSENTE'}`);

    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log("❌ AUTH DEBUG: No se encontró el token en el header");
        logger.warn(`⛔ Intento de acceso no autorizado desde IP: ${req.ip}`);
        return res.status(401).json({ error: "Acceso denegado: Falta Token de sesión" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            // CHIVATO 2: Ver por qué falla la verificación
            console.log(`❌ AUTH DEBUG ERROR: ${err.message}`);
            console.log(`ℹ️ AUTH DEBUG: Clave usada empieza por: ${SECRET_KEY.substring(0, 5)}...`);
            
            logger.error(`❌ Token inválido o expirado para IP: ${req.ip}`);
            return res.status(403).json({ error: "Token inválido o expirado" });
        }
        
        // CHIVATO 3: Éxito
        console.log(`✅ AUTH DEBUG: Token válido. Usuario ID: ${user.id}`);

        req.user = user;
        req.userId = user.id; // IMPORTANTE: Añadido para compatibilidad con isAdmin.js
        next();
    });
}

// 🛑 RATE LIMITER (INTACTO)
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