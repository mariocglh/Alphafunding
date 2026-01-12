const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🦈 Creando Plan 'FXIFY Style' Completo...");

  const planFxify = await prisma.plan.create({
    data: {
      name: "One Phase - 50k Pro",
      
      // PRECIO Y BALANCE
      price: 280.0,              // Precio de oferta (según foto)
      initialBalance: 50000.0,   // Cuenta de 50k
      
      // REGLAS DE LA FOTO (Imagen 1)
      profitTarget: 10.0,        // Objetivo $5,000 (10%)
      dailyDrawdown: 3.0,        // Límite diario estricto (3%)
      maxDrawdown: 6.0,          // Pérdida máxima (6%)
      isRefundable: true,        // "Tarifa reembolsable: 100%"
      
      // REGLAS TÉCNICAS (Imagen 2)
      minTradingDays: 5,         // "Minimum trading days: 5 días"
      maxTradingDays: 0,         // "Maximum trading days: Ilimitados" (Ponemos 0 para infinito)
      profitSplit: 90,           // "División de ganancias: up to 90%"
      leverage: 50,              // "Apalancamiento: up to 50:1"
      newsTrading: true,         // "Operaciones en noticias: Sí"

      // RETIROS (Tu pregunta específica)
      payoutFrequency: 14        // Estándar de industria: Primer retiro a los 14 o 30 días
    }
  });

  console.log("✅ ¡Plan 50k (Full Specs) creado!");
  console.log(planFxify);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());