import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const { searchParams } = new URL(req.url);
    const lineUserId = searchParams.get('lineUserId');
    const groupId = params.id;

    if (!lineUserId) return errors.unauthorized();

    try {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.notFound('Profile');

        // Check if user is member of this group
        const { data: membership } = await supabaseAdmin
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', profile.id)
            .single();

        if (!membership) return errors.forbidden('Not a member of this group');

        // Fetch Group details
        const { data: group, error: groupErr } = await supabaseAdmin
            .from('groups')
            .select('*')
            .eq('id', groupId)
            .single();

        if (groupErr) throw groupErr;

        // Fetch Members
        const { data: members, error: membersErr } = await supabaseAdmin
            .from('group_members')
            .select('role, profiles(id, points, line_user_id)')
            .eq('group_id', groupId);

        if (membersErr) throw membersErr;

        const formattedMembers = members.map(m => ({
            id: (m.profiles as any).id,
            points: (m.profiles as any).points,
            role: m.role,
            name: 'Member' // In production, get name from LINE or profile
        }));

        return apiSuccess({
            group: {
                ...group,
                total_points: formattedMembers.reduce((sum, m) => sum + (m.points || 0), 0)
            },
            members: formattedMembers
        });
    } catch (err) {
        console.error(err);
        return errors.internal();
    }
}
