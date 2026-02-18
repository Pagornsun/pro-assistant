import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
    const limited = rateLimit(request);
    if (limited) return limited;

    const searchParams = request.nextUrl.searchParams;
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
        return errors.unauthorized();
    }

    try {
        // 1. Get Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tier, preferences')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) {
            // Return empty/default instead of error to avoid crashing UI on first login
            return apiSuccess({ profile: null, tasks: [], membership: 'free' });
        }

        // 2. Get Tasks
        const { data: tasks, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (taskError) {
            console.error('[GET /api/dashboard/data] Task fetch error:', taskError);
            return errors.internal();
        }

        return apiSuccess({
            profile,
            tasks: tasks || [],
            membership: profile.tier || 'free',
        });

    } catch (error) {
        console.error('[GET /api/dashboard/data] Unexpected error:', error);
        return errors.internal();
    }
}
