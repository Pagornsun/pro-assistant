import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    // 1. Check Auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Check Role
    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // NOTE: For now, if role column doesn't exist yet in prod, this might fail. 
    // We assume migration runs. 
    // If running freshly, we might need to fallback to email check?
    // Let's rely on role. If null/error, fallback to 'user'.

    const isAdmin = profile?.role === 'admin' || user.email === 'admin@kinn.ai'; // Fallback for initial admin

    if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        // 3. Fetch Stats (Using Admin Client to bypass RLS if needed, or just standard queries)
        // Count Users
        const { count: totalUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // Count Tasks
        const { count: totalTasks } = await supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact', head: true });

        // MRR (Estimate: Pro users * 199)
        const { count: proUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('tier', 'pro');

        const mrr = (proUsers || 0) * 199;

        // Active Users (Updated profile in last 7 days? Or tasks created?)
        // Let's count users who updated profile recently
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { count: activeUsers } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .gte('updated_at', sevenDaysAgo.toISOString());

        return NextResponse.json({
            data: {
                totalUsers: totalUsers || 0,
                totalTasks: totalTasks || 0,
                activeUsers: activeUsers || 0,
                mrr: mrr || 0
            }
        });

    } catch (error: unknown) {
        console.error('[AdminUsers] Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
