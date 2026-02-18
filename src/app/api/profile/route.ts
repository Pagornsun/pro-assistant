
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, apiError, handleZodError, errors } from '@/lib/api-response';
import { updateProfileSchema } from '@/lib/schemas';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    try {
        const { searchParams } = new URL(req.url);
        const lineUserId = searchParams.get('lineUserId');

        if (!lineUserId) {
            return errors.unauthorized();
        }

        const { data: profile, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('line_user_id', lineUserId)
            .single();

        if (error) {
            console.error('[Profile API] Fetch error:', error);
            return errors.notFound('ข้อมูลผู้ใช้งาน');
        }

        return apiSuccess(profile);

    } catch (error) {
        console.error('[Profile API] Internal error:', error);
        return errors.internal();
    }
}

export async function PATCH(req: NextRequest) {
    const limited = rateLimit(req);
    if (limited) return limited;

    try {
        const body = await req.json();

        // We expect lineUserId to be passed in the body for identification
        const { lineUserId, ...updates } = body;

        if (!lineUserId) {
            return errors.unauthorized();
        }

        const validation = updateProfileSchema.safeParse(updates);

        if (!validation.success) {
            return handleZodError(validation.error);
        }

        const { preferences } = validation.data;

        // Fetch current profile to merge preferences
        const { data: currentProfile, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('preferences')
            .eq('line_user_id', lineUserId)
            .single();

        if (fetchError) {
            return errors.notFound('ไม่พบข้อมูลผู้ใช้งาน');
        }

        const currentPrefs = currentProfile.preferences || {};
        const newPrefs = { ...currentPrefs, ...preferences };

        const { data: updatedProfile, error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ preferences: newPrefs })
            .eq('line_user_id', lineUserId)
            .select()
            .single();

        if (updateError) {
            console.error('[Profile API] Update error:', updateError);
            return errors.internal();
        }

        return apiSuccess(updatedProfile);

    } catch (error) {
        console.error('[Profile API] Internal error:', error);
        return errors.internal();
    }
}
