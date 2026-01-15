const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Conectando a la Base de Datos...");
  const users = await prisma.user.findMany();
  
  if (users.length === 0) {
      console.log("❌ LA BASE DE DATOS ESTÁ VACÍA.");
      console.log("👉 Solución: Ve a tu web y regístrate primero.");
  } else {
      console.log(`✅ Se encontraron ${users.length} usuarios:`);
      users.forEach(u => {
          console.log(` - Email: ${u.email} | Rol: ${u.role} | ID: ${u.id}`);
      });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());