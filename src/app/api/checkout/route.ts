import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
    try {
        const { userId, priceId } = await req.json();

        if (!userId || !priceId) {
            return NextResponse.json({ error: 'Missing userId or priceId' }, { status: 400 });
        }

        // 1. Get user email (for receipt)
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);
        const email = user?.user?.email;

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'], // Subscriptions usually require cards
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_LIFF_URL || 'http://localhost:3000'}/dashboard?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_LIFF_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
            client_reference_id: userId,
            customer_email: email,
            metadata: {
                userId: userId
            }
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
