// src/controllers/tradeController.js
const prisma = require('../config/db');
const { getServerPrice, ALLOWED_SYMBOLS } = require('../utils/priceEngine');
const winston = require('winston');

// Logger local
const logger = winston.createLogger({
    transports: [ new winston.transports.File({ filename: 'logs/combined.log' }) ]
});

// ABRIR TRADE
exports.placeTrade = async (req, res) => {
    try {
        const { accountId, symbol, type, lots } = req.body;
        if (!ALLOWED_SYMBOLS.includes(symbol)) return res.status(400).json({ error: "Símbolo no permitido" });
        
        const cleanLots = parseFloat(lots);
        const now = new Date();

        // ---------------------------------------------------------
        // 🛡️ REGLA 3: WEEKEND GUARD (Viernes después de las 21:00)
        // ---------------------------------------------------------
        const currentHour = now.getUTCHours(); // Hora en UTC
        const currentDay = now.getUTCDay();    // 0=Domingo, 5=Viernes, 6=Sábado

        // Si es Viernes (5) y son más de las 21:00, o es Sábado (6)
        if ((currentDay === 5 && currentHour >= 21) || currentDay === 6) {
            return res.status(400).json({ error: "⛔ Mercado cerrado por Fin de Semana (Weekend Rule)." });
        }

        const result = await prisma.$transaction(async (tx) => {
            const account = await tx.tradingAccount.findUnique({ where: { id: accountId } });
            if (!account || account.userId !== req.user.userId) throw new Error("Acceso denegado");
            
            // Permitimos operar a cuentas ACTIVE y LIVE
            if (!['ACTIVE', 'LIVE'].includes(account.status)) {
                throw new Error(`Cuenta bloqueada o no apta para operar (Estado: ${account.status})`);
            }

            // ---------------------------------------------------------
            // 🛡️ REGLA 4A: ANTI-HFT (Frecuencia de Trading)
            // ---------------------------------------------------------
            // Si la última operación fue hace menos de 5 segundos -> BLOQUEAR
            if (account.lastTradeDate) {
                const diffTime = Math.abs(now - new Date(account.lastTradeDate));
                if (diffTime < 5000) { // 5000 ms = 5 segundos
                    throw new Error("⛔ HFT DETECTADO: Debes esperar 5 segundos entre operaciones.");
                }
            }

            const realPrice = await getServerPrice(symbol);
            
            const newTrade = await tx.trade.create({
                data: {
                    accountId, symbol, type, lots: cleanLots, openPrice: realPrice,
                    status: 'OPEN', ticket: Math.floor(1000000 + Math.random() * 9000000), openTime: now
                }
            });

            await tx.tradingAccount.update({
                where: { id: accountId }, data: { lastTradeDate: now }
            });

            return newTrade;
        });

        logger.info(`📈 Trade ABIERTO: ${type} ${symbol}`);
        res.status(201).json({ message: "Orden enviada", trade: result });

    } catch (error) {
        res.status(400).json({ error: error.message || "Error al operar" });
    }
};

// CERRAR TRADE
exports.closeTrade = async (req, res) => {
    try {
        const { tradeId } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const trade = await tx.trade.findUnique({ where: { id: tradeId }, include: { account: { include: { plan: true } } } });
            if (!trade || trade.status === 'CLOSED' || trade.account.userId !== req.user.userId) throw new Error("Operación inválida");

            const closeTime = new Date();
            const realClosePrice = await getServerPrice(trade.symbol);
            let multiplier = (realClosePrice > 500) ? 1 : 100000;
            
            let profit = 0;
            if (trade.type === 'BUY') profit = (realClosePrice - trade.openPrice) * trade.lots * multiplier;
            else profit = (trade.openPrice - realClosePrice) * trade.lots * multiplier;
            
            // ---------------------------------------------------------
            // 🛡️ REGLA 4B: SCALPING PROTECTION (Duración mínima)
            // ---------------------------------------------------------
            const durationSeconds = (closeTime - new Date(trade.openTime)) / 1000;
            let finalProfit = parseFloat(profit.toFixed(2));
            let statusMessage = "CLOSED";

            // Si duró menos de 30 segundos y ganó dinero, ANULAMOS la ganancia.
            // ---------------------------------------------------------
// 🛡️ REGLA 4B: ANTI-ARBITRAJE (Mínimo 2 minutos)
// ---------------------------------------------------------
const MIN_DURATION = 120; // 120 segundos = 2 minutos

// Si duró menos de 2 minutos y ganó dinero, ANULAMOS la ganancia.
if (durationSeconds < MIN_DURATION && finalProfit > 0) {
    finalProfit = 0; // Se queda en 0
    logger.warn(`⚠️ Scalping/Arbitraje detectado en trade ${trade.ticket}. Duración: ${durationSeconds}s. Beneficio anulado.`);
}

            await tx.trade.update({
                where: { id: tradeId },
                data: { status: 'CLOSED', closePrice: realClosePrice, closeTime: closeTime, profit: finalProfit }
            });

            let updatedAccount = await tx.tradingAccount.update({
                where: { id: trade.accountId },
                data: { balance: { increment: finalProfit }, equity: { increment: finalProfit }, lastTradeDate: closeTime }
            });

            // Check Riesgo al cerrar
            const initBal = trade.account.plan.initialBalance;
            const current = updatedAccount.balance;
            const dailyStart = updatedAccount.dailyStartBalance;

            // Total Drawdown
            if ((initBal - current) >= (initBal * (trade.account.plan.maxDrawdown / 100))) {
                updatedAccount = await tx.tradingAccount.update({ where: { id: trade.accountId }, data: { status: 'BREACHED' } });
            }
            
            // Daily Drawdown
            if (['ACTIVE', 'LIVE'].includes(updatedAccount.status) && (dailyStart - current) >= (initBal * (trade.account.plan.dailyDrawdown / 100))) {
                updatedAccount = await tx.tradingAccount.update({ where: { id: trade.accountId }, data: { status: 'BREACHED' } });
            }

            await tx.balanceHistory.create({ data: { accountId: trade.accountId, balance: updatedAccount.balance, time: new Date() } });

            return { profit: finalProfit, newBalance: updatedAccount.balance, newStatus: updatedAccount.status, duration: durationSeconds };
        });

        // Mensaje especial si hubo scalping
        if (result.duration < 30 && result.profit === 0) {
            res.json({ ...result, message: "⚠️ Trade cerrado. Beneficio anulado por cierre prematuro (<30s)." });
        } else {
            res.json(result);
        }

    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};