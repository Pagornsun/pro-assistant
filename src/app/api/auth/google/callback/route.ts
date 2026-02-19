import { google } from 'googleapis';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const lineUserId = searchParams.get('state'); // We passed userId as state
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.redirect(new URL(`/dashboard/calendar?error=${error}`, request.url));
    }

    if (!code || !lineUserId) {
        return NextResponse.redirect(new URL('/dashboard/calendar?error=missing_params', request.url));
    }

    try {
        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = process.env.GOOGLE_REDIRECT_URI;

        if (!clientId || !clientSecret || !redirectUri) {
            throw new Error('Missing Google OAuth Env Vars');
        }

        const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);

        // Get User Info (Email)
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Update Supabase Profile
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token || undefined, // Only update if new one exists
                google_email: email,
                google_calendar_last_sync: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('line_user_id', lineUserId);

        if (updateError) {
            console.error('Supabase Update Error:', updateError);
            throw new Error('Failed to update profile');
        }

        // Redirect based on Environment
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
            return NextResponse.redirect(`https://liff.line.me/${liffId}/dashboard/calendar?success=true`);
        }

        return NextResponse.redirect(new URL('/dashboard/calendar?success=true', request.url));

    } catch (err) {
        console.error('Callback Error:', err);
        // Try to return to LIFF even on error
        const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
        if (liffId) {
            return NextResponse.redirect(`https://liff.line.me/${liffId}/dashboard/calendar?error=auth_failed`);
        }
        return NextResponse.redirect(new URL('/dashboard/calendar?error=auth_failed', request.url));
    }
}
