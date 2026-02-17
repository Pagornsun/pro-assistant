const fs = require('fs');
const path = require('path');
const Stripe = require('stripe');

// Manually load .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
}

async function testStripe() {
    console.log("🔍 Testing Stripe Connection...");

    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("❌ STRIPE_SECRET_KEY is missing!");
        return;
    }

    if (!process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
        console.error("❌ NEXT_PUBLIC_STRIPE_PRICE_ID is missing!");
        return;
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    try {
        console.log(`Checking Price ID: ${process.env.NEXT_PUBLIC_STRIPE_PRICE_ID}`);

        // 1. Retrieve Price to check visibility
        const price = await stripe.prices.retrieve(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
        console.log(`✅ Price Found: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`);

        // 2. Try creating a dummy session
        console.log("Creating Test Checkout Session...");
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID, quantity: 1 }],
            mode: 'subscription',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
        });

        console.log("✅ Checkout Session Created Successfully!");
        console.log(`URL: ${session.url}`);
        console.log("\n🎉 SYSTEM VERIFICATION PASSED. You can proceed with deployment.");

    } catch (error) {
        console.error("❌ Stripe Error:", error.message);
    }
}

testStripe();
