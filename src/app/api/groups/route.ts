import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get('lineUserId');

    if (!lineUserId) return errors.unauthorized();

    try {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.notFound('Profile');

        // Fetch groups where user is a member
        const { data: groups, error } = await supabaseAdmin
            .from('group_members')
            .select('group_id, groups(id, name, owner_id)')
            .eq('user_id', profile.id);

        if (error) throw error;

        const formattedGroups = groups.map(g => ({
            ...(g.groups as any),
            member_count: 1 // Simplified for now
        }));

        return apiSuccess({ groups: formattedGroups });
    } catch (err) {
        console.error(err);
        return errors.internal();
    }
}

export async function POST(req: NextRequest) {
    const lineUserId = req.headers.get('x-line-user-id');
    if (!lineUserId) return errors.unauthorized();

    try {
        const { name } = await req.json();
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.notFound('Profile');

        // 1. Create Group
        const { data: group, error: groupErr } = await supabaseAdmin
            .from('groups')
            .insert({ name, owner_id: profile.id })
            .select()
            .single();

        if (groupErr) throw groupErr;

        // 2. Add Owner as Admin Member
        await supabaseAdmin
            .from('group_members')
            .insert({ group_id: group.id, user_id: profile.id, role: 'admin' });

        return apiSuccess(group, 201);
    } catch (err) {
        console.error(err);
        return errors.internal();
    }
}
