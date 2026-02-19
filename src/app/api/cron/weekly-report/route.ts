import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { generatePeriodicSummary } from '@/lib/gemini';
import { lineClient } from '@/lib/line';
import { getBriefingFlexMessage } from '@/lib/flex';

export async function GET(req: NextRequest) {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Cron] Starting Weekly Report...');

        // Profiles with weekly enabled
        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, line_user_id, preferences, google_access_token');

        if (!profiles) return NextResponse.json({ message: 'No profiles' });

        const results = [];
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6); // Sunday
        endOfWeek.setHours(23, 59, 59, 999);

        for (const profile of profiles) {
            try {
                if (!profile.preferences?.briefing_weekly_enabled) continue;

                // 1. Fetch Weekly Tasks
                const { data: tasks } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('user_id', profile.id)
                    .gte('due_date', startOfWeek.toISOString())
                    .lte('due_date', endOfWeek.toISOString());

                // 2. Fetch Weekly Events (Mock or real)
                let events: any[] = [];
                // API logic for events...

                if ((tasks && tasks.length > 0) || events.length > 0) {
                    const briefingText = await generatePeriodicSummary(tasks || [], events, 'weekly');
                    const flexMessage = getBriefingFlexMessage(briefingText, (tasks?.length || 0));

                    // Customize Flex for Weekly
                    flexMessage.altText = 'Weekly Report from Kinn';
                    const bubble = flexMessage.contents as any;
                    if (bubble.type === 'bubble' && bubble.header?.contents) {
                        const headerContents = bubble.header.contents as any[];
                        if (headerContents.length >= 2) {
                            headerContents[0].text = 'WEEKLY REPORT';
                            headerContents[1].text = 'สรุปภาพรวมประจำสัปดาห์ 📊';
                        }
                    }

                    await lineClient.pushMessage(profile.line_user_id, flexMessage);
                    results.push({ userId: profile.line_user_id, status: 'sent' });
                }
            } catch (err) {
                console.error(err);
            }
        }

        return NextResponse.json({ processed: results.length, results });
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
