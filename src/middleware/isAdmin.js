const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isAdmin = async (req, res, next) => {
    try {
        // req.userId viene del middleware 'auth' que se ejecuta antes
        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso Denegado: Requiere nivel Dios ⚡' });
        }

        next(); // Si es admin, pasa
    } catch (error) {
        res.status(500).json({ error: 'Error verificando permisos' });
    }
};

module.exports = isAdmin;