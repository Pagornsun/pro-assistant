import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';
import { getOrCreateProfile } from '@/lib/line';

export async function GET(request: NextRequest) {
    const limited = rateLimit(request);
    if (limited) return limited;

    const searchParams = request.nextUrl.searchParams;
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
        return errors.unauthorized();
    }

    try {
        // 1. Get or Create Profile
        // If user accesses dashboard before following bot, they might not have a profile yet.
        let profile;
        try {
            profile = await getOrCreateProfile(lineUserId);
        } catch (err) {
            console.error('[GET /api/dashboard/data] Profile creation failed:', err);
            // Fallback to "Guest" mode if creation fails (should rarely happen)
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

        // 3. Get Today's Usage Count (for Progress Bar)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { count: usageCount, error: countError } = await supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .gte('created_at', today.toISOString());

        if (countError) {
            console.error('[GET /api/dashboard/data] Usage count error:', countError);
            // Non-critical, continue with null usage
        }

        return apiSuccess({
            profile,
            tasks: tasks || [],
            membership: profile.tier || 'free',
            usageCount: usageCount || 0,
            usageLimit: 5, // Hardcoded for MVP, could be dynamic based on tier/config
        });

    } catch (error) {
        console.error('[GET /api/dashboard/data] Unexpected error:', error);
        return errors.internal();
    }
}
