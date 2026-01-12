const { PrismaClient } = require('@prisma/client');

// Iniciamos la conexión con logs de error para depuración
const prisma = new PrismaClient({
    log: ['error', 'warn'],
});

module.exports = prisma;