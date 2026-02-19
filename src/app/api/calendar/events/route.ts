import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) {
        return NextResponse.json({ error: 'Missing lineUserId' }, { status: 400 });
    }

    // 1. Get Tokens from DB
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('google_access_token, google_refresh_token')
        .eq('line_user_id', lineUserId)
        .single();

    if (!profile || !profile.google_refresh_token) {
        return NextResponse.json({ error: 'Not connected to Google Calendar', code: 'not_connected' }, { status: 401 });
    }

    // 2. Setup Google Client
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        console.error('Missing Google OAuth Env Vars');
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    oauth2Client.setCredentials({
        access_token: profile.google_access_token,
        refresh_token: profile.google_refresh_token
    });

    // Handle Token Refresh (Simple way: googleapis does it automatically on request if refresh_token is set)
    // But we should listen for updates to save new access_token if it changes
    oauth2Client.on('tokens', async (tokens) => {
        if (tokens.access_token) {
            await supabaseAdmin
                .from('profiles')
                .update({
                    google_access_token: tokens.access_token,
                    ...(tokens.refresh_token && { google_refresh_token: tokens.refresh_token }),
                    updated_at: new Date().toISOString()
                })
                .eq('line_user_id', lineUserId);
        }
    });

    try {
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

        // 3. Fetch Events (Next 7 days)
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: now.toISOString(),
            timeMax: nextWeek.toISOString(),
            singleEvents: true,
            orderBy: 'startTime',
        });

        const events = response.data.items || [];

        // 4. Transform for Frontend
        const formattedEvents = events.map(event => ({
            id: event.id,
            summary: event.summary || 'No Title',
            start: event.start?.dateTime || event.start?.date,
            end: event.end?.dateTime || event.end?.date,
            link: event.htmlLink,
            location: event.location
        }));

        return NextResponse.json({ data: formattedEvents });

    } catch (err) {
        console.error('Calendar Fetch Error:', err);
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}
