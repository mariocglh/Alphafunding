const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const isAdmin = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ error: 'No autenticado' });
        }

        const user = await prisma.user.findUnique({
            where: { id: req.userId }
        });

        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acceso Denegado: Requiere nivel Dios ⚡' });
        }

        next();
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error verificando permisos' });
    }
};

module.exports = isAdmin;