// makeAdmin.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const emailToPromote = "afundingroot@gmail.com"; // <--- PON TU EMAIL

async function promote() {
    console.log(`👑 Buscando a ${emailToPromote}...`);
    try {
        const user = await prisma.user.update({
            where: { email: emailToPromote },
            data: { role: 'ADMIN' }
        });
        console.log(`✅ ¡ÉXITO! ${user.name} ahora es ADMIN.`);
    } catch (e) {
        console.error("❌ Error: No se encontró el usuario o falló la BD.", e);
    }
}

promote();