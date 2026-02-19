import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import Stripe from 'stripe';

export async function POST(req: Request) {
    const body = await req.text();
    const headerPayload = await headers();
    const signature = headerPayload.get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error('STRIPE_WEBHOOK_SECRET is missing');
        }
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: unknown) {
        console.error('Webhook Error:', err);
        return NextResponse.json({ error: err instanceof Error ? err.message : 'Unknown error' }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve the user ID from metadata (we sent this during checkout creation)
        const userId = session.metadata?.userId;

        if (userId) {
            console.log(`✅ Payment successful for User: ${userId}. Upgrading to PRO...`);

            // Update User Tier in Supabase
            const { error } = await supabaseAdmin
                .from('profiles')
                .update({ tier: 'pro' })
                .eq('id', userId);

            if (error) {
                console.error('❌ Failed to update user tier:', error);
                return NextResponse.json({ error: 'Database Update Failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
