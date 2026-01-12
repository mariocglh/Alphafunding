// src/controllers/accountController.js
const prisma = require('../config/db');
const winston = require('winston');

// Configuración de logs
const logger = winston.createLogger({ transports: [ new winston.transports.File({ filename: 'logs/combined.log' }) ] });

// 1. DASHBOARD
exports.getDashboard = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: { include: { plan: true, trades: { where: { status: 'OPEN' }, orderBy: { openTime: 'desc' } } } } }
        });
        if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

        const dashboardData = {
            player: { name: `${user.firstName} ${user.lastName}`, email: user.email },
            stats: { totalAccounts: user.accounts.length, totalEquity: user.accounts.reduce((sum, acc) => sum + acc.equity, 0) },
            accounts: user.accounts.map(acc => ({ 
                id: acc.id, 
                login: acc.login, 
                plan: acc.plan.name, 
                initialBalance: acc.plan.initialBalance, 
                balance: acc.balance, 
                equity: acc.equity, 
                status: acc.status, 
                openTrades: acc.trades 
            }))
        };
        res.json(dashboardData);
    } catch (error) { res.status(500).json({ error: "Error dashboard" }); }
};

// 2. COMPRAR CUENTA
exports.createAccount = async (req, res) => {
    try {
        const { userId, planName } = req.body;
        let plan = await prisma.plan.findFirst({ where: { name: planName } });
        if (!plan) plan = await prisma.plan.findFirst({ where: { name: "Challenge 100k" } });

        const newAccount = await prisma.tradingAccount.create({
            data: {
                login: Math.floor(100000 + Math.random() * 900000),
                password: "Pass" + Math.random().toString(36).slice(-8),
                balance: plan.initialBalance, equity: plan.initialBalance, dailyStartBalance: plan.initialBalance,
                lastDailyReset: new Date(), lastTradeDate: new Date(), userId: userId, planId: plan.id, status: 'ACTIVE'
            }
        });
        await prisma.balanceHistory.create({ data: { accountId: newAccount.id, balance: newAccount.balance, time: new Date() } });
        res.status(201).json({ message: "Cuenta creada", account: newAccount });
    } catch (error) { res.status(500).json({ error: "Error creando cuenta" }); }
};

// 3. LISTAR PLANES
exports.getPlans = async (req, res) => {
    try { const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } }); res.json(plans); }
    catch (e) { res.status(500).json({ error: "Error planes" }); }
};

// 4. CHECK RISK
exports.checkRisk = async (req, res) => {
    try {
        const { accountId } = req.body;
        const account = await prisma.tradingAccount.findUnique({ where: { id: accountId }, include: { plan: true } });
        if (!account) return res.status(404).json({ error: "No encontrada" });
        
        if (!['ACTIVE', 'LIVE'].includes(account.status)) {
             return res.status(400).json({ error: `Estado no válido: ${account.status}` });
        }

        const now = new Date(); const lastReset = new Date(account.lastDailyReset);
        if (now.getDate() !== lastReset.getDate() || now.getMonth() !== lastReset.getMonth()) {
            await prisma.tradingAccount.update({ where: { id: accountId }, data: { dailyStartBalance: account.balance, lastDailyReset: now } });
            account.dailyStartBalance = account.balance;
        }
        
        const currentLossTotal = account.plan.initialBalance - account.equity;
        if (currentLossTotal >= (account.plan.initialBalance * (account.plan.maxDrawdown / 100))) {
            await prisma.tradingAccount.update({ where: { id: accountId }, data: { status: 'BREACHED' }});
            return res.json({ status: "BREACHED" });
        }
        const currentLossDaily = account.dailyStartBalance - account.equity;
        if (currentLossDaily >= (account.plan.initialBalance * (account.plan.dailyDrawdown / 100))) {
            await prisma.tradingAccount.update({ where: { id: accountId }, data: { status: 'BREACHED' }});
            return res.json({ status: "BREACHED" });
        }
        res.json({ status: "SAFE" });
    } catch (e) { res.status(500).json({ error: "Error riesgo" }); }
};

// 5. ANALISIS DETALLADO
exports.getAnalysis = async (req, res) => {
    try {
        const { accountId } = req.params;
        const account = await prisma.tradingAccount.findUnique({
            where: { id: accountId }, include: { trades: { orderBy: { closeTime: 'desc' } }, history: { orderBy: { time: 'asc' } } }
        });
        if (!account || account.userId !== req.user.userId) return res.status(403).json({ error: "Denegado" });
        
        const closedTrades = account.trades.filter(t => t.status === 'CLOSED');
        res.json({ history: closedTrades, chartData: account.history.map(h => ({ time: h.time, balance: h.balance })) });
    } catch (e) { res.status(500).json({ error: "Error analisis" }); }
};

// 6. EVALUAR EXAMEN (CON REGLA DE CONSISTENCIA)
exports.evaluateAccount = async (req, res) => {
    try {
        const { accountId } = req.body;
        const account = await prisma.tradingAccount.findUnique({ where: { id: accountId }, include: { trades: true, plan: true } });
        
        if(['PASSED','BREACHED','FUNDED', 'LIVE'].includes(account.status)) {
            return res.json({ profit: account.balance - account.plan.initialBalance, verdict: account.status });
        }

        const validTrades = account.trades.filter(t => t.status === 'CLOSED');
        const uniqueDays = new Set(validTrades.map(t => new Date(t.openTime).toDateString())).size;
        const profit = account.balance - account.plan.initialBalance;
        
        // ------------------------------------------
        // 🛡️ REGLA 1: CONSISTENCIA (Max 50%)
        // ------------------------------------------
        let consistencyCheck = true;
        let biggestTrade = 0;
        
        if (profit > 0) {
            // Buscamos el trade con más beneficio
            biggestTrade = Math.max(...validTrades.map(t => t.profit));
            // Si ese trade es más del 50% del beneficio total, falla.
            if (biggestTrade > (profit * 0.50)) {
                consistencyCheck = false;
            }
        }

        // CONDICIONES PARA APROBAR:
        const targetReached = profit >= (account.plan.initialBalance * 0.08);
        const daysReached = uniqueDays >= 0; // En dev mode es 0, pon 5 para producción
        
        if (targetReached && daysReached) {
            if (!consistencyCheck) {
                // Si llegó al dinero pero falló consistencia, no aprueba aún.
                return res.json({ 
                    profit, 
                    validDays: uniqueDays, 
                    verdict: "CONSISTENCIA FALLIDA",
                    reason: `Tu mejor operación ($${biggestTrade.toFixed(2)}) es más del 50% de tu beneficio total.` 
                });
            }

            await prisma.tradingAccount.update({ where: { id: accountId }, data: { status: 'PASSED' } });
            return res.json({ profit, validDays: uniqueDays, verdict: "APROBADO" });
        }

        res.json({ profit, validDays: uniqueDays, verdict: "EN PROGRESO" });
    } catch (e) { res.status(500).json({ error: "Error evaluar" }); }
};

// 7. RECLAMAR CUENTA REAL
exports.claimFunded = async (req, res) => {
    try {
        const { accountId } = req.body;
        const old = await prisma.tradingAccount.findUnique({ where: { id: accountId }, include: { plan: true } });
        if (old.status !== 'PASSED') return res.status(400).json({ error: "No aprobada" });

        const funded = await prisma.tradingAccount.create({
            data: { login: Math.floor(100000+Math.random()*900000), password: "LIVE"+Math.random(), balance: old.plan.initialBalance, equity: old.plan.initialBalance, dailyStartBalance: old.plan.initialBalance, userId: req.user.userId, planId: old.planId, status: 'LIVE' }
        });
        await prisma.tradingAccount.update({ where: { id: accountId }, data: { status: 'FUNDED' } });
        res.json({ message: "OK", account: funded });
    } catch (e) { res.status(500).json({ error: "Error claim" }); }
};

// 8. BORRAR CUENTA
exports.deleteAccount = async (req, res) => {
    try {
        const { accountId } = req.body;
        const account = await prisma.tradingAccount.findUnique({ where: { id: accountId } });
        
        if (!account || account.userId !== req.user.userId) return res.status(403).json({ error: "No permitido" });

        await prisma.trade.deleteMany({ where: { accountId } });
        await prisma.balanceHistory.deleteMany({ where: { accountId } });
        await prisma.tradingAccount.delete({ where: { id: accountId } });

        res.json({ message: "Eliminada" });
    } catch (e) { res.status(500).json({ error: "Error al eliminar" }); }
};

// 9. FUSIONAR CUENTAS
exports.mergeAccounts = async (req, res) => {
    try {
        const { accountIds } = req.body;

        if (!accountIds || accountIds.length < 2) {
            return res.status(400).json({ error: "Selecciona al menos 2 cuentas" });
        }

        const result = await prisma.$transaction(async (tx) => {
            const accounts = await tx.tradingAccount.findMany({
                where: { id: { in: accountIds } },
                include: { plan: true }
            });

            if (accounts.length !== accountIds.length) throw new Error("Alguna cuenta no existe");
            for (const acc of accounts) {
                if (acc.userId !== req.user.userId) throw new Error("Acceso denegado");
                if (acc.status !== 'LIVE') throw new Error("Solo se fusionan cuentas LIVE");
            }

            const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
            const totalEquity = accounts.reduce((sum, acc) => sum + acc.equity, 0);
            const totalInitialBase = accounts.reduce((sum, acc) => sum + acc.plan.initialBalance, 0);
            const totalDailyStart = accounts.reduce((sum, acc) => sum + acc.dailyStartBalance, 0);

            let targetPlan = await tx.plan.findFirst({
                where: { initialBalance: { lte: totalInitialBase } }, 
                orderBy: { initialBalance: 'desc' }
            });
            const finalPlanId = targetPlan ? targetPlan.id : accounts[0].planId;

            const mergedAccount = await tx.tradingAccount.create({
                data: {
                    login: Math.floor(100000 + Math.random() * 900000),
                    password: "MEGA" + Math.random().toString(36).slice(-8),
                    balance: totalBalance,
                    equity: totalEquity,
                    dailyStartBalance: totalDailyStart,
                    lastDailyReset: new Date(), 
                    lastTradeDate: new Date(),
                    userId: req.user.userId,
                    planId: finalPlanId, 
                    status: 'LIVE'
                }
            });

            await tx.tradingAccount.updateMany({
                where: { id: { in: accountIds } },
                data: { status: 'MERGED', balance: 0, equity: 0 }
            });

            return mergedAccount;
        });

        res.json({ message: "¡Fusión Masiva Completada! 🧬", account: result });

    } catch (e) { 
        res.status(400).json({ error: e.message || "Error en la fusión" }); 
    }
};