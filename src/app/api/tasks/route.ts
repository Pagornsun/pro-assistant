
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { createTaskSchema } from '@/lib/schemas';
import { apiSuccess, errors, handleZodError } from '@/lib/api-response';
import { rateLimit } from '@/lib/rate-limit';

// GET /api/tasks?lineUserId=&status=&search=&limit=&offset=
export async function GET(request: NextRequest) {
    const limited = rateLimit(request);
    if (limited) return limited;
    const { searchParams } = new URL(request.url);
    const lineUserId = searchParams.get('lineUserId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!lineUserId) {
        return errors.unauthorized();
    }

    try {
        // Resolve profile from lineUserId
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) {
            return errors.notFound('โปรไฟล์');
        }

        // Build query
        let query = supabaseAdmin
            .from('tasks')
            .select('*', { count: 'exact' })
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
        }

        const { data: tasks, error: taskError, count } = await query;

        if (taskError) {
            console.error('[GET /api/tasks] DB error:', taskError);
            return errors.internal();
        }

        return apiSuccess({ tasks: tasks || [], total: count ?? 0, limit, offset });
    } catch (err) {
        console.error('[GET /api/tasks] Unexpected error:', err);
        return errors.internal();
    }
}

// POST /api/tasks
export async function POST(request: NextRequest) {
    const limited = rateLimit(request);
    if (limited) return limited;

    const lineUserId = request.headers.get('x-line-user-id');

    if (!lineUserId) {
        return errors.unauthorized();
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errors.internal('ข้อมูล JSON ไม่ถูกต้อง');
    }

    let input;
    try {
        input = createTaskSchema.parse(body);
    } catch (err) {
        if (err instanceof ZodError) return handleZodError(err);
        return errors.internal();
    }

    try {
        // Resolve profile
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, tier')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError || !profile) {
            return errors.notFound('โปรไฟล์');
        }

        // CHECK USAGE LIMIT (Freemium)
        if (profile.tier === 'free') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const { count, error: countError } = await supabaseAdmin
                .from('tasks')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', profile.id)
                .gte('created_at', today.toISOString());

            if (!countError && (count || 0) >= 5) {
                return NextResponse.json({
                    error: 'LIMIT_REACHED',
                    message: 'คุณใช้โควต้าสร้างงานครบ 5 งานสำหรับวันนี้แล้ว กรุณาอัปเกรดเป็น Pro เพื่อใช้งานไม่จำกัด',
                }, { status: 403 });
            }
        }

        const { data: task, error: taskError } = await supabaseAdmin
            .from('tasks')
            .insert({
                user_id: profile.id,
                title: input.title,
                description: input.description ?? null,
                due_date: input.due_date ?? null,
                recurring_config: input.recurring_config ?? null, // ADDED
                tags: input.tags ?? [], // ADDED
                status: 'pending',
            })
            .select()
            .single();

        if (taskError) {
            console.error('[POST /api/tasks] DB error:', taskError);
            return errors.internal();
        }

        return apiSuccess(task, 201);
    } catch (err) {
        console.error('[POST /api/tasks] Unexpected error:', err);
        return errors.internal();
    }
}
