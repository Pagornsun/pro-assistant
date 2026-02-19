import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const lineUserId = searchParams.get('userId');

    if (!lineUserId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !clientSecret || !redirectUri) {
        console.error('Missing Google OAuth Env Vars');
        return NextResponse.json({ error: 'Server Configuration Error' }, { status: 500 });
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    const scopes = [
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/userinfo.email' // To get email for display
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Request refresh token
        scope: scopes,
        state: lineUserId, // Pass userId to callback to link account
        prompt: 'consent' // Force consent to ensure refresh token is returned
    });

    return NextResponse.redirect(url);
}
