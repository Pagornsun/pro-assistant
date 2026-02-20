
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, getUserIdFromRequest } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return errors.unauthorized();

        const { data: notifications, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50); // Hard limit for now

        if (error) {
            console.error('[Notifications API] Fetch error:', error);
            return errors.internal();
        }

        return apiSuccess(notifications);
    } catch (error) {
        console.error('[Notifications API] Internal error:', error);
        return errors.internal();
    }
}
