
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, getUserIdFromRequest } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // Updated for Next.js 15+ async params
) {
    const limited = rateLimit(req);
    if (limited) return limited;

    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return errors.unauthorized();

        const { id } = await context.params;
        const body = await req.json();

        // Only allow marking as read for now
        if (typeof body.is_read !== 'boolean') {
            return errors.badRequest('Invalid body');
        }

        const { data, error } = await supabaseAdmin
            .from('notifications')
            .update({ is_read: body.is_read })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) {
            console.error('[Notifications API] Update error:', error);
            return errors.internal();
        }

        return apiSuccess(data);
    } catch (error) {
        console.error('[Notifications API] Internal error:', error);
        return errors.internal();
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const limited = rateLimit(req);
    if (limited) return limited;

    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return errors.unauthorized();

        const { id } = await context.params;

        const { error } = await supabaseAdmin
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('[Notifications API] Delete error:', error);
            return errors.internal();
        }

        return apiSuccess({ success: true });
    } catch (error) {
        console.error('[Notifications API] Internal error:', error);
        return errors.internal();
    }
}
