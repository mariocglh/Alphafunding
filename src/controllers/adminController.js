const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Definimos la función primero
const getAllData = async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            include: { accounts: true },
            orderBy: { createdAt: 'desc' }
        });

        const totalUsers = users.length;
        const totalAccounts = users.reduce((acc, user) => acc + user.accounts.length, 0);
        
        res.json({
            stats: { totalUsers, totalAccounts },
            users: users
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error obteniendo datos globales' });
    }
};

// 🔥 EXPORTACIÓN SEGURA
module.exports = { getAllData };