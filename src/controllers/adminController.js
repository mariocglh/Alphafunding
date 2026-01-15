const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getAllData = async (req, res) => {
    try {
        // Obtenemos TODOS los usuarios y sus cuentas
        const users = await prisma.user.findMany({
            include: {
                accounts: true
            },
            orderBy: {
                createdAt: 'desc' // Los más nuevos primero
            }
        });

        // Calculamos estadísticas globales
        const totalUsers = users.length;
        const totalAccounts = users.reduce((acc, user) => acc + user.accounts.length, 0);
        
        // Enviamos todo al frontend
        res.json({
            stats: { totalUsers, totalAccounts },
            users: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo datos globales' });
    }
};