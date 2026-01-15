const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. OBTENER DATOS (Ya lo tenías)
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

// 2. BANEAR USUARIO (NUEVO 🔥)
const banUser = async (req, res) => {
    const { id } = req.params; // Recibimos el ID de la URL
    console.log(`💀 GOD MODE: Intentando eliminar al usuario ${id}`);

    try {
        // Borramos el usuario (Prisma borrará sus cuentas automáticamente si está configurado en cascada,
        // si no, primero borramos las cuentas y luego el usuario)
        
        // Opción segura: Borrar cuentas primero manual
        await prisma.account.deleteMany({ where: { userId: id } });
        
        // Ahora borrar usuario
        await prisma.user.delete({ where: { id: id } });

        console.log(`💀 GOD MODE: Usuario ${id} ELIMINADO.`);
        res.json({ message: 'Usuario eliminado correctamente' });

    } catch (error) {
        console.error("❌ Error al banear:", error);
        res.status(500).json({ error: 'No se pudo eliminar al usuario' });
    }
};

module.exports = { getAllData, banUser };