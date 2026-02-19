import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generateBriefing } from '@/lib/gemini';
import { lineClient } from '@/lib/line';
import { getBriefingFlexMessage } from '@/lib/flex';

export async function GET(req: NextRequest) {
    // 1. Authorization check (Simple token for now or Vercel header)
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting Daily Briefing...');

        // 2. Fetch all profiles
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, line_user_id, preferences');

        if (profileError) throw profileError;

        const results = [];

        // 3. Process each user
        for (const profile of profiles) {
            try {
                // Get Today's tasks in Bangkok Time
                const now = new Date();
                const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
                today.setHours(0, 0, 0, 0);
                const tonight = new Date(today);
                tonight.setHours(23, 59, 59, 999);

                const { data: tasks, error: taskError } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('status', 'pending')
                    .gte('due_date', today.toISOString())
                    .lte('due_date', tonight.toISOString());

                if (taskError) throw taskError;

                if (tasks && tasks.length > 0) {
                    console.log(`[Cron] Found ${tasks.length} tasks for user ${profile.line_user_id}`);

                    // Generate AI Briefing
                    const briefingText = await generateBriefing(tasks);

                    // Send LINE Flex Message
                    const flexMessage = getBriefingFlexMessage(briefingText, tasks.length);

                    await lineClient.pushMessage(profile.line_user_id, flexMessage);

                    results.push({ userId: profile.line_user_id, status: 'success' });
                } else {
                    results.push({ userId: profile.line_user_id, status: 'no_tasks' });
                }

            } catch (userErr) {
                console.error(`[Cron] Error for user ${profile.line_user_id}:`, userErr);
                results.push({ userId: profile.line_user_id, status: 'error', error: String(userErr) });
            }
        }

        return NextResponse.json({
            message: 'Daily briefing completed',
            count: results.length,
            results
        });

    } catch (error) {
        console.error('[Cron] Daily Briefing Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
