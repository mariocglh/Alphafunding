/**
 * 🚀 ETHERNAL CAPITALS PRO - MAIN ENTRY POINT
 */

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path'); // Importado una sola vez aquí arriba
const prisma = require('./src/config/db');

dotenv.config();

// 🔥 NUEVO: Importamos Stripe usando la clave de tu .env
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); 

// --- RUTAS MODULARES ---
// Nota: Usamos ./src/routes/ porque tu index.js está en la raíz
const authRoutes = require('./src/routes/authRoutes');
const tradeRoutes = require('./src/routes/tradeRoutes');
const accountRoutes = require('./src/routes/accountRoutes');
const userRoutes = require('./src/routes/userRoutes');

// 🔥 RUTA ADMIN (GOD MODE)
const adminRoutes = require('./src/routes/super_admin'); 

// 🔥 NUEVO: Ruta de Pagos
const paymentRoutes = require('./src/routes/paymentRoutes'); 

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================================
// 🔥 WEBHOOK DE STRIPE (CREACIÓN AUTOMÁTICA DE CUENTAS) 🔥
// =====================================================================
app.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Error de seguridad en Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // 1. Recuperamos los metadatos
        const userId = session.metadata.userId;
        const planName = session.metadata.planName;

        console.log(`💰 Pago confirmado para el plan: ${planName}`);

        try {
            // 2. Buscamos el plan en la base de datos
            const plan = await prisma.plan.findFirst({
                where: { name: planName }
            });

            if (!plan) throw new Error("Plan no encontrado en la BD");

            // 3. Generamos credenciales para la cuenta de trading
            // Genera un número de login de 8 dígitos aleatorio
            const newLogin = Math.floor(10000000 + Math.random() * 90000000); 
            // Genera una contraseña aleatoria de 8 caracteres
            const newPassword = Math.random().toString(36).slice(-8); 

            // 4. ¡CREAMOS LA CUENTA DE TRADING AL USUARIO!
            await prisma.tradingAccount.create({
                data: {
                    login: newLogin,
                    password: newPassword,
                    balance: plan.initialBalance,
                    equity: plan.initialBalance,
                    dailyStartBalance: plan.initialBalance, // Muy importante para el Drawdown diario
                    status: "ACTIVE",
                    userId: userId,
                    planId: plan.id
                }
            });

            console.log(`✅ ¡Misión Cumplida! Cuenta de $${plan.initialBalance} creada y asignada al usuario.`);
        } catch (error) {
            console.error(`❌ Error al crear la cuenta en la BD:`, error);
        }
    }

    res.json({received: true});
});
// =====================================================================

// MIDDLEWARES (Ahora sí, procesamos todo en JSON para el resto de la app)
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
app.use('/api/payments', paymentRoutes); // 🔥 NUEVO: Conectamos tu controlador de pagos

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
        console.log(`✅ ETHERNAL CAPITALS PRO CORRIENDO EN PUERTO ${PORT}`);
        console.log(`📂 Modo Modular: 100% ACTIVO`);
        console.log(`👤 Sistema de Usuarios: ONLINE`);
        console.log(`👑 Admin God Mode: PREPARADO`);
        console.log(`💳 Pasarela Stripe: ONLINE y ESCUCHANDO`); // 🔥 NUEVO
    });
});