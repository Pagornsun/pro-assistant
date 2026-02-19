import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', params.id)
        .eq('user_id', user.id)
        .single();

    if (error || !task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ data: task });
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();

    const { data: updated, error } = await supabase
        .from('tasks')
        .update(body)
        .eq('id', params.id)
        .eq('user_id', user.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Handle Recurring Logic if completed
    if (body.status === 'done' && updated.recurring_config) {
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
        await supabase.from('tasks').insert({
            user_id: user.id,
            title: updated.title,
            description: updated.description,
            due_date: nextDueDate.toISOString(),
            status: 'pending',
            recurring_config: config,
            tags: updated.tags
        });
    }

    return NextResponse.json({ data: updated });
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', params.id)
        .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ success: true });
}
