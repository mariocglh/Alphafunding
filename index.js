/**
 * 🚀 ALPHAFUNDING PRO - MAIN ENTRY POINT
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path'); // Importado una sola vez aquí arriba
const prisma = require('./src/config/db');

// --- RUTAS MODULARES ---
// Nota: Usamos ./src/routes/ porque tu index.js está en la raíz
const authRoutes = require('./src/routes/authRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const userRoutes = require('./src/routes/userRoutes');

// 🔥 RUTA ADMIN (GOD MODE)
// Asegúrate de que el archivo en la carpeta se llame 'super_admin.js'
const adminRoutes = require('./src/routes/super_admin'); 

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CONECTAR RUTAS
app.use('/', authRoutes);
app.use('/', tradeRoutes);
app.use('/', accountRoutes);
app.use('/users', userRoutes); 
app.use('/api/admin', adminRoutes); // Conectamos el panel de admin

// SEMBRADO DE PLANES (Simple y directo)
async function initPlans() {
    const count = await prisma.plan.count();
    if (count === 0) {
        console.log("🌱 Sembrando planes por defecto...");
        await prisma.plan.createMany({
            data: [
                { name: "Starter 10k", price: 100, initialBalance: 10000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 8, leverage: 100, minTradingDays: 5 },
                { name: "Standard 50k", price: 300, initialBalance: 50000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 8, leverage: 100, minTradingDays: 5 },
                { name: "Challenge 100k", price: 500, initialBalance: 100000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 8, leverage: 100, minTradingDays: 5 },
                { name: "Pro 200k", price: 900, initialBalance: 200000, maxDrawdown: 10, dailyDrawdown: 5, profitTarget: 8, leverage: 100, minTradingDays: 5 }
            ]
        });
    }
}

// ARRANQUE
initPlans().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ ALPHAFUNDING PRO CORRIENDO EN PUERTO ${PORT}`);
        console.log(`📂 Modo Modular: 100% ACTIVO`);
        console.log(`👤 Sistema de Usuarios: ONLINE`);
        console.log(`👑 Admin God Mode: PREPARADO`);
    });
});