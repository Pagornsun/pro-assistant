
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

export async function DELETE(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    const lineUserId = req.headers.get('x-line-user-id');
    if (!lineUserId) {
        return errors.unauthorized();
    }

    try {
        // 1. Get User ID from Profiles (to get Supabase Auth ID)
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (!profile) {
            return errors.notFound('ไม่พบข้อมูลผู้ใช้งาน');
        }

        // 2. Delete User from Supabase Auth
        // This usually triggers CASCADE delete on public.profiles if configured, 
        // but we can also delete manually to be sure/verbose.
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
            profile.id
        );

        if (deleteError) {
            console.error('[API] Delete user error:', deleteError);
            return errors.internal('ไม่สามารถลบบัญชีได้');
        }

        // 3. (Optional) Stripe cancellation could go here if we stored subscription ID
        // For now, we rely on them being removed or a webhook handling it.

        return apiSuccess({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('[API] Internal error:', error);
        return errors.internal();
    }
}
