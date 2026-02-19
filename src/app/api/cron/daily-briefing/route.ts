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
            .select('id, line_user_id, preferences, google_access_token');

        if (profileError) throw profileError;

        const results = [];
        const now = new Date();
        const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        const currentHour = bangkokTime.getHours();
        const currentMin = bangkokTime.getMinutes();

        // 3. Process each user
        for (const profile of profiles) {
            try {
                const prefs = profile.preferences || {};
                if (!prefs.briefing_daily_enabled) continue;

                // Time Check: Match within 30 min window (if cron runs every 30m)
                if (prefs.briefing_daily_time) {
                    const [pHour, pMin] = prefs.briefing_daily_time.split(':').map(Number);
                    const diffMins = (currentHour * 60 + currentMin) - (pHour * 60 + pMin);
                    if (diffMins < 0 || diffMins >= 30) continue;
                }

                // Get Today's tasks
                const today = new Date(bangkokTime);
                today.setHours(0, 0, 0, 0);
                const tonight = new Date(today);
                tonight.setHours(23, 59, 59, 999);

                const { data: tasks } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('status', 'pending')
                    .gte('due_date', today.toISOString())
                    .lte('due_date', tonight.toISOString());

                // Fetch Calendar Events
                let events: any[] = [];
                if (profile.google_access_token) {
                    try {
                        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${today.toISOString()}&timeMax=${tonight.toISOString()}&singleEvents=true`, {
                            headers: { Authorization: `Bearer ${profile.google_access_token}` }
                        });
                        if (calRes.ok) {
                            const calData = await calRes.json();
                            events = calData.items || [];
                        }
                    } catch (e) {
                        console.warn('Google Cal access failed');
                    }
                }

                if ((tasks && tasks.length > 0) || events.length > 0) {
                    const briefingText = await generateBriefing(tasks || []);
                    const flexMessage = getBriefingFlexMessage(briefingText, (tasks?.length || 0));
                    await lineClient.pushMessage(profile.line_user_id, flexMessage);
                    results.push({ userId: profile.line_user_id, status: 'sent' });
                }
            } catch (userErr) {
                console.error(`[Cron] Error for ${profile.line_user_id}:`, userErr);
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
