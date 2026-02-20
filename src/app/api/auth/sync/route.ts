
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOrCreateProfile } from '@/lib/line';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { lineUserId, displayName, pictureUrl } = body;

        if (!lineUserId) {
            return NextResponse.json({ error: 'Missing lineUserId' }, { status: 400 });
        }

        // 1. Ensure Profile Exists (Reusing logic from line.ts)
        const profile = await getOrCreateProfile(lineUserId);

        // 2. Update Display Name / Picture if provided
        if (displayName || pictureUrl) {
            await supabaseAdmin.from('profiles').update({
                display_name: displayName,
                picture_url: pictureUrl
            }).eq('id', profile.id);
        }

        return NextResponse.json({ success: true, profile });

    } catch (error: unknown) {
        console.error('Auth Sync Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
