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
        console.log('[Cron] Starting Monthly Report...');

        const { data: profiles } = await supabaseAdmin
            .from('profiles')
            .select('id, line_user_id, preferences, google_access_token');

        if (!profiles) return NextResponse.json({ message: 'No profiles' });

        const results = [];
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        for (const profile of profiles) {
            try {
                if (!profile.preferences?.briefing_monthly_enabled) continue;

                // 1. Fetch Monthly Tasks (Done & Pending)
                const { data: tasks } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('user_id', profile.id)
                    .gte('created_at', startOfMonth.toISOString())
                    .lte('created_at', endOfMonth.toISOString());

                let events: any[] = [];
                // API logic for events...

                if ((tasks && tasks.length > 0) || events.length > 0) {
                    const briefingText = await generatePeriodicSummary(tasks || [], events, 'monthly');
                    const flexMessage = getBriefingFlexMessage(briefingText, (tasks?.length || 0));

                    // Customize Flex for Monthly
                    flexMessage.altText = 'Monthly Report from Kinn';
                    const bubble = flexMessage.contents as any;
                    if (bubble.type === 'bubble' && bubble.header?.contents) {
                        const headerContents = bubble.header.contents as any[];
                        if (headerContents.length >= 2) {
                            headerContents[0].text = 'MONTHLY REPORT';
                            headerContents[1].text = 'สรุปภาพรวมประจำเดือน 🏆';
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
