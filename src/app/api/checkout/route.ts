import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';
import { NextRequest } from 'next/server';
import { apiError, errors } from '@/lib/api-response';

export async function POST(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    // 1. Validate User via Header
    const lineUserId = req.headers.get('x-line-user-id');
    if (!lineUserId) return errors.unauthorized();

    try {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, email') // Assuming email might be in profile or we fetch from auth
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.unauthorized();

        const body = await req.json();
        const priceId = body.priceId || process.env.STRIPE_PRICE_ID_PRO;

        if (!priceId) {
            return apiError('CONFIG_ERROR', 'Service Plan ID not configured', 500);
        }

        // 2. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_LIFF_URL || 'http://localhost:3000'}/dashboard?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_LIFF_URL || 'http://localhost:3000'}/dashboard/subscription?payment=cancelled`,
            client_reference_id: profile.id,
            metadata: {
                userId: profile.id,
                lineUserId: lineUserId
            }
        });

        return NextResponse.json({ url: session.url });

    } catch (error) {
        console.error('[POST /api/checkout] Stripe error:', error);
        return errors.internal('ไม่สามารถเริ่มการชำระเงินได้');
    }
}
