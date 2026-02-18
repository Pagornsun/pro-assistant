
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, apiError } from '@/lib/api-response';
import { stripe } from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';
import Stripe from 'stripe';

// GET /api/subscription?lineUserId=...
export async function GET(request: NextRequest) {
    const limited = rateLimit(request);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) return errors.unauthorized();

    try {
        // 1. Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tier')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) return errors.notFound('โปรไฟล์');

        // 2. If free, return simple status
        if (profile.tier === 'free') {
            return apiSuccess({
                tier: 'free',
                status: 'active',
            });
        }

        // 3. If pro, find subscription in Stripe
        // We search by metadata because we might not have stored stripe_customer_id yet
        const searchResult = await stripe.subscriptions.search({
            query: `metadata['userId']:'${profile.id}' AND status:'active'`,
            limit: 1,
        });

        const subscription = searchResult.data[0] as Stripe.Subscription;

        if (!subscription) {
            // Fallback: DB says pro but no active stripe sub found?
            // Maybe manual override or expired but webhook missed?
            return apiSuccess({
                tier: 'pro',
                status: 'unknown',
                message: 'Subscription not found in Stripe',
            });
        }

        return apiSuccess({
            tier: 'pro',
            status: subscription.status,
            cancel_at_period_end: subscription.cancel_at_period_end,
            current_period_end: new Date(((subscription as any).current_period_end || 0) * 1000).toISOString(),
            subscription_id: subscription.id,
        });

    } catch (error) {
        console.error('[GET /api/subscription] Error:', error);
        return errors.internal();
    }
}

// DELETE /api/subscription (Cancel)
export async function DELETE(request: NextRequest) {
    const limited = rateLimit(request); // Fixed: rateLimit only takes one arg
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) return errors.unauthorized();

    try {
        // 1. Get user profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) return errors.notFound('โปรไฟล์');

        // 2. Find subscription
        const searchResult = await stripe.subscriptions.search({
            query: `metadata['userId']:'${profile.id}' AND status:'active'`,
            limit: 1,
        });

        const subscription = searchResult.data[0] as Stripe.Subscription;

        if (!subscription) {
            return errors.notFound('ไม่พบข้อมูลการสมัครสมาชิก');
        }

        // 3. Cancel securely (at period end)
        const updatedSub = await stripe.subscriptions.update(subscription.id, {
            cancel_at_period_end: true,
        });

        return apiSuccess({
            status: updatedSub.status,
            cancel_at_period_end: updatedSub.cancel_at_period_end,
            current_period_end: new Date(((updatedSub as any).current_period_end || 0) * 1000).toISOString(),
        });

    } catch (error) {
        console.error('[DELETE /api/subscription] Error:', error);
        return errors.internal('ไม่สามารถยกเลิกการสมัครได้ กรุณาลองใหม่');
    }
}
