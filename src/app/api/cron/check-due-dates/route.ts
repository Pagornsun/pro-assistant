import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { lineClient } from '@/lib/line';

export async function GET(req: Request) {
    try {
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const now = new Date();
        const results = {
            reminder_24h: 0,
            reminder_1h: 0,
            errors: [] as string[]
        };

        // 1. Check for tasks due in 24 hours (23-25 hours range)
        const start24h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
        const end24h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

        const { data: tasks24h, error: error24h } = await supabaseAdmin
            .from('tasks')
            .select('*, profiles!inner(line_user_id)')
            .eq('status', 'pending')
            .is('is_reminded_24h', false)
            .gte('due_date', start24h)
            .lte('due_date', end24h);

        if (error24h) throw error24h;

        if (tasks24h && tasks24h.length > 0) {
            for (const task of tasks24h) {
                if (!task.profiles || !task.profiles.line_user_id) continue;

                try {
                    await lineClient.pushMessage(task.profiles.line_user_id, {
                        type: 'text',
                        text: `⏰ เตือนความจำ: งาน "${task.title}" ครบกำหนดพรุ่งนี้ครับ\nเวลา: ${new Date(task.due_date).toLocaleString('th-TH')}`
                    });

                    await supabaseAdmin
                        .from('tasks')
                        .update({ is_reminded_24h: true })
                        .eq('id', task.id);

                    results.reminder_24h++;
                } catch (e: unknown) {
                    console.error(`Failed to send 24h reminder for task ${task.id}`, e);
                    results.errors.push(`Task ${task.id} (24h): ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }
        }

        // 2. Check for tasks due in 1 hour (55-65 mins range)
        const start1h = new Date(now.getTime() + 55 * 60 * 1000).toISOString();
        const end1h = new Date(now.getTime() + 65 * 60 * 1000).toISOString();

        const { data: tasks1h, error: error1h } = await supabaseAdmin
            .from('tasks')
            .select('*, profiles!inner(line_user_id)')
            .eq('status', 'pending')
            .is('is_reminded_1h', false)
            .gte('due_date', start1h)
            .lte('due_date', end1h);

        if (error1h) throw error1h;

        if (tasks1h && tasks1h.length > 0) {
            for (const task of tasks1h) {
                if (!task.profiles || !task.profiles.line_user_id) continue;

                try {
                    await lineClient.pushMessage(task.profiles.line_user_id, {
                        type: 'text',
                        text: `🚨 ด่วน! งาน "${task.title}" จะครบกำหนดในอีก 1 ชั่วโมงครับ\nอย่าลืมจัดการนะครับ!`
                    });

                    await supabaseAdmin
                        .from('tasks')
                        .update({ is_reminded_1h: true })
                        .eq('id', task.id);

                    results.reminder_1h++;
                } catch (e: unknown) {
                    console.error(`Failed to send 1h reminder for task ${task.id}`, e);
                    results.errors.push(`Task ${task.id} (1h): ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }
        }

        return NextResponse.json({ success: true, results });

    } catch (error: unknown) {
        console.error('Cron Job Failed:', error);
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
    }
}
