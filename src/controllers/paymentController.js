const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
    try {
        const { planName, price, userId } = req.body;

        if (!planName || !price || !userId) {
            return res.status(400).json({ error: "Faltan datos para crear la sesión de pago." });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: 'usd',
                    product_data: { name: `Evaluación Ethernal Capitals - ${planName}` },
                    unit_amount: price * 100, 
                },
                quantity: 1,
            }],
            mode: 'payment',
            metadata: { 
                userId: userId.toString(), 
                planName: planName 
            }, 
            success_url: `${req.headers.origin}/dashboard.html?payment=success`,
            cancel_url: `${req.headers.origin}/dashboard.html?payment=cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("Error al generar sesión de Stripe:", error);
        res.status(500).json({ error: "Error interno al generar el pago." });
    }
};

// 🔥 EXPORTACIÓN SEGURA
module.exports = {
    createCheckoutSession
};