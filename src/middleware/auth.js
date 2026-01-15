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
        new winston.transports.Console({ format: winston.format.simple() })
    ],
});

const SECRET_KEY = process.env.JWT_SECRET || "mi_clave_secreta_super_segura_alphafunding_2026";

// 👮 AUTENTICACIÓN JWT (CON FIX DE ID 🛠️)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        console.log("❌ AUTH: Falta token");
        return res.status(401).json({ error: "Acceso denegado" });
    }

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) {
            console.log(`❌ AUTH ERROR: ${err.message}`);
            return res.status(403).json({ error: "Token inválido" });
        }
        
        // 🔥 AQUÍ ESTÁ EL ARREGLO 🔥
        // Buscamos el ID en user.id O en user.userId
        const userId = user.id || user.userId;

        console.log("📦 CONTENIDO DEL TOKEN:", user); // Para que veas qué trae
        console.log(`✅ ID DETECTADO FINAL: ${userId}`);

        if (!userId) {
            console.log("❌ ERROR CRÍTICO: El token no tiene ID");
            return res.status(403).json({ error: "Token mal formado (sin ID)" });
        }

        req.user = user;
        req.userId = userId; // Guardamos el ID correcto
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
        res.status(options.statusCode).send(options.message);
    }
});

module.exports = { authenticateToken, tradeLimiter, SECRET_KEY };