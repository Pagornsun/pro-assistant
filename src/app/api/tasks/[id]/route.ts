import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { apiSuccess, errors, apiError } from '@/lib/api-response';

// Helper to validate user
async function validateUser(req: NextRequest) {
    const lineUserId = req.headers.get('x-line-user-id') || req.nextUrl.searchParams.get('lineUserId');

    if (!lineUserId) {
        return null;
    }

    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

    if (error || !profile) {
        return null;
    }

    return profile.id;
}

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = await validateUser(req);
    if (!userId) return errors.unauthorized();

    const { data: task, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', userId)
        .single();

    if (error || !task) return errors.notFound('งาน');

    return apiSuccess(task);
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = await validateUser(req);
    if (!userId) return errors.unauthorized();

    let body;
    try {
        body = await req.json();
    } catch {
        return apiError('INVALID_INPUT', 'ข้อมูล JSON ไม่ถูกต้อง', 400);
    }

    const { data: updated, error } = await supabaseAdmin
        .from('tasks')
        .update(body)
        .eq('id', params.id)
        .eq('user_id', userId)
        .select()
        .single();

    if (error) {
        console.error('[PATCH /api/tasks/[id]] DB Error:', error);
        return errors.internal();
    }

    // 1. Gamification: Award points if marked 'done'
    if (body.status === 'done') {
        try {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('points, level')
                .eq('id', userId)
                .single();

            // Dynamic points based on priority
            let earnedPoints = 10;
            if (updated.priority === 'high') earnedPoints = 30;
            else if (updated.priority === 'medium') earnedPoints = 20;

            const currentPoints = (profile?.points || 0) + earnedPoints;
            const newLevel = Math.floor(currentPoints / 100) + 1;

            await supabaseAdmin
                .from('profiles')
                .update({ points: currentPoints, level: newLevel })
                .eq('id', userId);
        } catch (e) {
            console.error('[Gamification] Failed to award points:', e);
        }
    }

    // 2. Handle Recurring Logic if completed
    if (body.status === 'done' && updated.recurring_config) {
        try {
            const config = updated.recurring_config as unknown as { frequency: string; interval?: number };
            const currentDueDate = updated.due_date ? new Date(updated.due_date) : new Date();
            const nextDueDate = new Date(currentDueDate);

            if (config.frequency === 'daily') {
                nextDueDate.setDate(nextDueDate.getDate() + (config.interval || 1));
            } else if (config.frequency === 'weekly') {
                nextDueDate.setDate(nextDueDate.getDate() + (config.interval || 1) * 7);
            } else if (config.frequency === 'monthly') {
                nextDueDate.setMonth(nextDueDate.getMonth() + (config.interval || 1));
            }

            // Create next instance
            await supabaseAdmin.from('tasks').insert({
                user_id: userId,
                title: updated.title,
                description: updated.description,
                due_date: nextDueDate.toISOString(),
                status: 'pending',
                recurring_config: config,
                tags: updated.tags,
                group_id: updated.group_id,
                assigned_to: updated.assigned_to
            });
        } catch (err) {
            console.error('[PATCH /api/tasks/[id]] Recurring logic error:', err);
        }
    }

    return apiSuccess(updated);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const userId = await validateUser(req);
    if (!userId) return errors.unauthorized();

    const { error, count } = await supabaseAdmin
        .from('tasks')
        .delete({ count: 'exact' })
        .eq('id', params.id)
        .eq('user_id', userId);

    if (error) {
        console.error('[DELETE /api/tasks/[id]] DB Error:', error);
        return errors.internal();
    }

    if (count === 0) {
        return errors.notFound('ไม่พบงานหรือผู่ใช้ไม่มีสิทธิ์');
    }

    return NextResponse.json({ success: true });
}
