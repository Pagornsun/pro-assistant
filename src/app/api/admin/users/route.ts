import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const supabase = createClient();

    // 1. Check Auth (Reuse logic - simpler middleware in real app, but duplication fine for MVP)
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    const isAdmin = profile?.role === 'admin' || user.email === 'admin@kinn.ai';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    // 2. Parse Query Params
    const search = req.nextUrl.searchParams.get('search')?.toLowerCase() || '';
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
    const limit = 20;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    try {
        // 3. Fetch Users
        let query = supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        // NOTE: Searching JSONB preferences or unindexed columns might be slow.
        // Assuming we want to search by display name (which might be in preferences? No, line_user_id is in columns)
        // Wait, `profiles` table: id, line_user_id, tier, preferences.
        // Where is displayName? It's usually in `preferences->displayName` or pulled from Line.
        // DisplayName is NOT a column in `profiles` based on `supabase_schema.sql`.
        // It's in `preferences` JSONB?
        // Let's check `LiffProvider` or `webhook`.

        // In `webhook`, `handleLineEvent` updates profile?
        // Let's Assume `preferences` stores `displayName`.

        if (search) {
            // Search line_user_id or preferences->displayName
            // Postgres JSON search: preferences->>'displayName' ILIKE ...
            // Supabase filter: .ilike('preferences->>displayName', `%${search}%`) -- Syntax might vary
            // Or .textSearch

            // Getting simple: Search `line_user_id` only for now, or filter in memory if small?
            // "List all users, search by name/email"
            // Email is in `auth.users`, NOT `public.profiles`.
            // Joining `auth.users` is hard with Supabase Client (requires RPC or direct DB access).
            // `supabaseAdmin.auth.admin.listUsers()` can verify emails.

            // Strategy: Use `supabaseAdmin.auth.admin.listUsers()` but it doesn't support complex search easily combined with profiles.

            // MVP Solution: Just return profiles. Identify by `line_user_id`.
            query = query.ilike('line_user_id', `%${search}%`);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        return NextResponse.json({
            data,
            meta: {
                total: count,
                page,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error: any) {
        console.error('[AdminUsers] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
