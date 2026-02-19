import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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

        if (search) {
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

    } catch (error: unknown) {
        console.error('[AdminUsers] Error:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
