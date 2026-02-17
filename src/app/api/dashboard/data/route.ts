import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
        return NextResponse.json({ error: 'Missing lineUserId' }, { status: 400 });
    }

    try {
        // 1. Get Profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tier, display_name')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) {
            // If profile doesn't exist, return empty/default instead of error to avoid crashing UI
            return NextResponse.json({
                profile: null,
                tasks: [],
                membership: 'free',
                message: 'Profile not found'
            });
        }

        // 2. Get Tasks
        const { data: tasks, error: taskError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(10);

        if (taskError) {
            console.error('Task Fetch Error:', taskError);
            return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
        }

        return NextResponse.json({
            profile,
            tasks: tasks || [],
            membership: profile.tier || 'free'
        });

    } catch (error: any) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
