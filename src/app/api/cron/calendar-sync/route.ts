import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Get Users with Sync Enabled
        const { data: profiles, error } = await supabaseAdmin
            .from('profiles')
            .select('id, google_refresh_token')
            .eq('calendar_sync_enabled', true)
            .not('google_refresh_token', 'is', null);

        if (error || !profiles) return NextResponse.json({ error: 'DB Error' }, { status: 500 });

        const results = await Promise.allSettled(profiles.map(async (profile) => {
            if (!profile.google_refresh_token) return;

            try {
                // A. Refresh Access Token
                const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        client_id: process.env.GOOGLE_CLIENT_ID!,
                        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                        refresh_token: profile.google_refresh_token,
                        grant_type: 'refresh_token',
                    }),
                });
                const tokens = await tokenRes.json();
                if (!tokens.access_token) throw new Error('Failed to refresh token');

                // B. Fetch Calendar Events (Next 7 Days)
                const now = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(now.getDate() + 7);

                const calendarRes = await fetch(
                    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${nextWeek.toISOString()}&singleEvents=true&orderBy=startTime`,
                    { headers: { Authorization: `Bearer ${tokens.access_token}` } }
                );
                const calendarData = await calendarRes.json();
                const events = calendarData.items || [];

                // C. Sync to Tasks
                let syncedCount = 0;
                for (const event of events) {
                    if (!event.summary) continue;

                    // Check if exists
                    const { data: existing } = await supabaseAdmin
                        .from('tasks')
                        .select('id')
                        .eq('user_id', profile.id)
                        .eq('google_event_id', event.id)
                        .single();

                    if (!existing) {
                        // Create Task
                        await supabaseAdmin.from('tasks').insert({
                            user_id: profile.id,
                            title: event.summary,
                            description: event.description || `Imported from Google Calendar`,
                            due_date: event.start.dateTime || event.start.date, // dateTime for specific time, date for all-day
                            status: 'pending',
                            google_event_id: event.id,
                            tags: ['Calendar']
                        });
                        syncedCount++;
                    }
                }
                return { userId: profile.id, synced: syncedCount };

            } catch (innerErr: any) {
                console.error(`Sync failed for user ${profile.id}:`, innerErr);
                return { userId: profile.id, error: innerErr.message };
            }
        }));

        return NextResponse.json({ success: true, results });

    } catch (err: any) {
        console.error('Calendar Sync Cron Error:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
