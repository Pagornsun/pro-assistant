import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, apiError } from '@/lib/api-response';

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string; memberId: string }> }
) {
    const params = await props.params;
    const lineUserId = req.headers.get('x-line-user-id');
    const groupId = params.id;
    const memberId = params.memberId;

    if (!lineUserId) return errors.unauthorized();

    try {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) return errors.notFound('Profile');

        // 1. Check if requester is group owner or admin
        const { data: group } = await supabaseAdmin
            .from('groups')
            .select('owner_id')
            .eq('id', groupId)
            .single();

        const { data: requesterMembership } = await supabaseAdmin
            .from('group_members')
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', profile.id)
            .single();

        const isOwner = group?.owner_id === profile.id;
        const isAdmin = requesterMembership?.role === 'admin';

        if (!isOwner && !isAdmin) {
            return errors.forbidden('Only admins can remove members');
        }

        // 2. Prevent removing the owner
        if (memberId === group?.owner_id) {
            return apiError('FORBIDDEN', 'Cannot remove the group owner', 403);
        }

        // 3. Remove the member
        const { error } = await supabaseAdmin
            .from('group_members')
            .delete()
            .eq('group_id', groupId)
            .eq('user_id', memberId);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('[Member Delete API]', err);
        return errors.internal();
    }
}
