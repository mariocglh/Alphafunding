const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createCheckoutSession = async (req, res) => {
    try {
        // 1. Recibimos el priceId (el de Stripe) y el userId (el de tu DB)
        const { priceId, userId } = req.body;

        // 2. Validación de seguridad
        if (!priceId || !userId) {
            return res.status(400).json({ error: "Faltan datos (priceId o userId) para crear el pago." });
        }

        // 3. Obtenemos la información del producto desde Stripe 
        // Esto es para que el Webhook sepa EXACTAMENTE qué plan activar
        const priceDetails = await stripe.prices.retrieve(priceId, { expand: ['product'] });
        const planNameFromStripe = priceDetails.product.name; // Ej: "Challenge 100k"

        // 4. Creamos la sesión real
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            mode: 'payment',
            allow_promotion_codes: true, // 🔥 ESTO permite usar el cupón del 100% que creamos
            line_items: [{
                price: priceId, // Usamos el ID de producto de Stripe
                quantity: 1,
            }],
            metadata: { 
                userId: userId.toString(), 
                planName: planNameFromStripe // Esto es lo que busca tu Webhook en index.js
            }, 
            success_url: `${req.headers.origin}/dashboard.html?payment=success`,
            cancel_url: `${req.headers.origin}/dashboard.html?payment=cancel`,
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error("❌ Error en Stripe:", error.message);
        res.status(500).json({ error: "Error al conectar con la pasarela de pagos." });
    }
};

module.exports = {
    createCheckoutSession
};