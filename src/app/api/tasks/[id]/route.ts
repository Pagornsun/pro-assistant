import { NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { supabaseAdmin } from '@/lib/supabase';
import { updateTaskSchema } from '@/lib/schemas';
import { apiSuccess, errors, handleZodError } from '@/lib/api-response';
import { addDays, addWeeks, addMonths } from 'date-fns'; // Need date-fns or native date logic

// Helper: verify task ownership
async function getTaskForUser(taskId: string, lineUserId: string) {
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

    if (!profile) return { task: null, profile: null, error: 'profile_not_found' };

    const { data: task } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

    if (!task) return { task: null, profile, error: 'task_not_found' };
    if (task.user_id !== profile.id) return { task, profile, error: 'forbidden' };

    return { task, profile, error: null };
}

// GET /api/tasks/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const lineUserId = request.headers.get('x-line-user-id');
    if (!lineUserId) return errors.unauthorized();

    const { task, error } = await getTaskForUser(id, lineUserId);
    if (error === 'profile_not_found') return errors.notFound('โปรไฟล์');
    if (error === 'task_not_found') return errors.notFound('งาน');
    if (error === 'forbidden') return errors.forbidden();

    return apiSuccess(task);
}

// PATCH /api/tasks/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const lineUserId = request.headers.get('x-line-user-id');
    if (!lineUserId) return errors.unauthorized();

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return errors.internal('ข้อมูล JSON ไม่ถูกต้อง');
    }

    let input;
    try {
        input = updateTaskSchema.parse(body);
    } catch (err) {
        if (err instanceof ZodError) return handleZodError(err);
        return errors.internal();
    }

    const { task, error } = await getTaskForUser(id, lineUserId);
    if (error === 'profile_not_found') return errors.notFound('โปรไฟล์');
    if (error === 'task_not_found') return errors.notFound('งาน');
    if (error === 'forbidden') return errors.forbidden();

    // Build update payload (only defined fields)
    const updates: Record<string, unknown> = {};
    if (input.title !== undefined) updates.title = input.title;
    if (input.description !== undefined) updates.description = input.description;
    if (input.status !== undefined) updates.status = input.status;
    if (input.due_date !== undefined) updates.due_date = input.due_date;
    if (input.tags !== undefined) updates.tags = input.tags; // ADDED

    if (Object.keys(updates).length === 0) {
        return apiSuccess(task); // Nothing to update
    }

    const { data: updated, error: updateError } = await supabaseAdmin
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (updateError) {
        console.error('[PATCH /api/tasks/:id] DB error:', updateError);
        return errors.internal();
    }

    // ─────────────────────────────────────────────────────────────
    // RECURRING TASKS LOGIC
    // ─────────────────────────────────────────────────────────────
    // If task is completed and has recurrence config, create the next one
    if (updates.status === 'done' && updated.recurring_config) {
        try {
            const config = updated.recurring_config as any; // { frequency, interval }
            const currentDueDate = updated.due_date ? new Date(updated.due_date) : new Date();
            let nextDueDate = new Date(currentDueDate);

            // Calculate next date
            const interval = config.interval || 1;
            if (config.frequency === 'daily') {
                nextDueDate.setDate(nextDueDate.getDate() + interval);
            } else if (config.frequency === 'weekly') {
                nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
            } else if (config.frequency === 'monthly') {
                nextDueDate.setMonth(nextDueDate.getMonth() + interval);
            }

            // Create next task
            await supabaseAdmin.from('tasks').insert({
                user_id: updated.user_id,
                title: updated.title,
                description: updated.description,
                status: 'pending',
                due_date: nextDueDate.toISOString(),
                recurring_config: config, // Pass config to next task so it keeps recurring
            });

            console.log(`[Recurring] Created next task for ${updated.id} due ${nextDueDate.toISOString()}`);
        } catch (err) {
            console.error('[Recurring] Failed to create next task:', err);
            // Don't fail the request, just log it. The user still completed the current task.
        }
    }

    return apiSuccess(updated);
}

// DELETE /api/tasks/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const lineUserId = request.headers.get('x-line-user-id');
    if (!lineUserId) return errors.unauthorized();

    const { error } = await getTaskForUser(id, lineUserId);
    if (error === 'profile_not_found') return errors.notFound('โปรไฟล์');
    if (error === 'task_not_found') return errors.notFound('งาน');
    if (error === 'forbidden') return errors.forbidden();

    const { error: deleteError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('id', id);

    if (deleteError) {
        console.error('[DELETE /api/tasks/:id] DB error:', deleteError);
        return errors.internal();
    }

    return apiSuccess({ message: 'ลบงานเรียบร้อยแล้ว' });
}
