
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, getUserIdFromRequest } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    // 1. Auth Check (In real app, check for 'admin' role)
    // For now, we'll just check if user exists. 
    // TODO: Add proper Admin Role check.
    const userId = await getUserIdFromRequest(req);
    if (!userId) return errors.unauthorized();

    try {
        // 2. Fetch Stats
        const { count: userCount } = await supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true });
        const { count: taskCount } = await supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true });
        const { count: activeTaskCount } = await supabaseAdmin.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'pending');

        // 3. Fetch Recent Users
        const { data: users } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        return apiSuccess({
            stats: {
                totalUsers: userCount || 0,
                totalTasks: taskCount || 0,
                activeTasks: activeTaskCount || 0,
            },
            recentUsers: users || []
        });

    } catch (error) {
        console.error('[Admin API] Error:', error);
        return errors.internal();
    }
}
