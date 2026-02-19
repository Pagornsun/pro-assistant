import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // This is userId

    if (error) {
        return NextResponse.redirect(new URL('/dashboard/profile?google_error=' + error, request.url));
    }

    if (!code || !state) {
        return NextResponse.json({ error: 'No code or state provided' }, { status: 400 });
    }

    try {
        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pro-assistant-kinn.vercel.app'}/api/auth/google/callback`,
                grant_type: 'authorization_code',
            }),
        });

        const tokenData = await tokenResponse.json();
        const tokens = tokenData as Record<string, unknown>;

        if (!tokenResponse.ok) {
            console.error('Token Exchange Error:', tokens);
            throw new Error((tokens.error_description as string) || 'Failed to exchange token');
        }

        // 2. Get User Email
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const userData = await userResponse.json();

        // 3. Update Supabase Profile (using Admin Client)
        // We trust the `state` contains the correct userId for this MVP.
        const userId = state;

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({
                google_refresh_token: (tokens.refresh_token as string) || undefined, // Only update if present
                google_email: userData.email,
                calendar_sync_enabled: true
            })
            .eq('id', userId);

        if (updateError) {
            throw new Error('Database Update Failed: ' + updateError.message);
        }

        return NextResponse.redirect(new URL('/dashboard/profile?google_connected=true', request.url));

    } catch (err: unknown) {
        console.error('Callback Error:', err);
        // The original code redirected to a profile page with an error message.
        // The instruction implies changing `any` to `unknown` and handling it.
        // The provided edit fragment for the final catch block was malformed,
        // so I'm preserving the original redirect behavior but with the `unknown` type.
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during Google callback.';
        return NextResponse.redirect(new URL('/dashboard/profile?google_error=' + encodeURIComponent(errorMessage), request.url));
    }
}
