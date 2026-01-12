const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🏭 Abriendo fábrica de planes...");

  // EL MENÚ DE FXIFY (1 Fase)
  // Aquí definimos solo lo que cambia (Nombre, Precio, Balance)
  const menuPlans = [
    { size: 15000,  price: 99,   name: "Starter 15k" },
    { size: 25000,  price: 175,  name: "Standard 25k" },
    { size: 50000,  price: 280,  name: "Pro 50k" },     // Este es el de la foto
    { size: 100000, price: 500,  name: "Elite 100k" },
    { size: 200000, price: 950,  name: "Whale 200k" }
  ];

  // BUCLE MÁGICO
  for (const item of menuPlans) {
    
    // Verificamos si ya existe para no duplicar
    const existe = await prisma.plan.findFirst({ where: { name: item.name } });
    if (existe) {
        console.log(`⚠️ El plan ${item.name} ya existe. Saltando...`);
        continue;
    }

    // Creamos el plan usando las reglas ESTÁNDAR (Porcentajes iguales para todos)
    await prisma.plan.create({
      data: {
        name: item.name,
        price: parseFloat(item.price),
        initialBalance: parseFloat(item.size),

        // REGLAS IDÉNTICAS PARA TODOS (Modelo 1 Fase FXIFY)
        profitTarget: 10.0,       // 10%
        dailyDrawdown: 3.0,       // 3%
        maxDrawdown: 6.0,         // 6%
        minTradingDays: 5,
        maxTradingDays: 0,        // Ilimitado
        profitSplit: 90,          // 90%
        leverage: 50,             // 1:50
        newsTrading: true,
        isRefundable: true,
        payoutFrequency: 14       // 14 Días
      }
    });
    console.log(`✅ Creado: ${item.name} ($${item.price})`);
  }

  console.log("🎉 ¡Tienda llena y lista para vender!");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());