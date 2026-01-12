const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const winston = require('winston');
const prisma = require('../config/db'); // Importamos la BD centralizada
const { SECRET_KEY } = require('../middleware/auth'); // Importamos la clave

// Configuración de Logs para el Auth
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.json()
    ),
    defaultMeta: { service: 'auth-controller' },
    transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
    ],
});

// --- LÓGICA DE REGISTRO ---
exports.register = async (req, res) => {
    try {
        const { email, password, firstName, lastName } = req.body;
        
        if (!email || !password || !firstName || !lastName) {
            return res.status(400).json({ error: "Todos los campos son obligatorios" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await prisma.user.create({
            data: { 
                email, 
                passwordHash: hashedPassword, 
                firstName, 
                lastName, 
                role: 'TRADER',
                kycStatus: 'PENDING'
            },
        });
        
        logger.info(`👤 Nuevo usuario registrado: ${newUser.email} (ID: ${newUser.id})`);
        res.status(201).json({ message: "Usuario creado con éxito", userId: newUser.id });
        
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "Este email ya está registrado en la plataforma." });
        }
        logger.error(`❌ Error en registro: ${error.message}`);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

// --- LÓGICA DE LOGIN ---
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            logger.warn(`🔒 Intento de login fallido (Usuario no existe): ${email}`);
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            logger.warn(`🔒 Intento de login fallido (Password incorrecto): ${email}`);
            return res.status(401).json({ error: "Credenciales inválidas" });
        }

        const token = jwt.sign({ userId: user.id, role: user.role }, SECRET_KEY, { expiresIn: '8h' });
        
        logger.info(`✅ Login exitoso: ${user.email}`);
        res.json({ message: "Login exitoso", token, userId: user.id, name: user.firstName });
        
    } catch (error) {
        logger.error(`❌ Error en login: ${error.message}`);
        res.status(500).json({ error: "Error procesando el login" });
    }
};