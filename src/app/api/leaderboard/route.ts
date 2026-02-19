import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get('lineUserId');
    const groupId = searchParams.get('groupId');

    if (!lineUserId) return errors.unauthorized();

    try {
        // 1. Get current user profile
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.notFound('Profile');

        let rankings;

        if (groupId) {
            // Group Rankings
            const { data, error } = await supabaseAdmin
                .from('group_members')
                .select('role, profiles(id, displayName, points, profile_url)')
                .eq('group_id', groupId)
                .order('profiles(points)', { ascending: false });

            if (error) throw error;
            rankings = data.map(r => ({
                id: (r.profiles as any).id,
                displayName: (r.profiles as any).displayName || 'Anonymous Player',
                points: (r.profiles as any).points || 0,
                profileUrl: (r.profiles as any).profile_url,
                role: r.role
            }));
        } else {
            // Global Rankings (Top 50)
            const { data, error } = await supabaseAdmin
                .from('profiles')
                .select('id, displayName, points, profile_url')
                .order('points', { ascending: false })
                .limit(50);

            if (error) throw error;
            rankings = data.map(p => ({
                id: p.id,
                displayName: p.displayName || 'Anonymous Player',
                points: p.points || 0,
                profileUrl: p.profile_url
            }));
        }

        return apiSuccess({ rankings, currentUserId: profile.id });
    } catch (err) {
        console.error('[Leaderboard API]', err);
        return errors.internal();
    }
}
