import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { lineClient } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Security Check (Vercel Cron)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const now = new Date();
        const fifteenMinutesLater = new Date(now.getTime() + 15 * 60000);

        // 2. Query Tasks due in next 15 mins
        // We select tasks where due_date is between NOW and NOW+15min
        // And reminded is false
        // And status is pending/processing
        const { data: tasks, error } = await supabaseAdmin
            .from('tasks')
            .select(`
                id,
                title,
                due_date,
                user_id,
                profiles!inner (
                    line_user_id,
                    display_name
                )
            `)
            .eq('reminded', false)
            .in('status', ['pending', 'processing'])
            .gt('due_date', now.toISOString())
            .lt('due_date', fifteenMinutesLater.toISOString());

        if (error) {
            console.error('Error fetching due tasks:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!tasks || tasks.length === 0) {
            return NextResponse.json({ success: true, message: 'No tasks due soon' });
        }

        // 3. Send Reminders
        const results = await Promise.allSettled(tasks.map(async (task) => {
            // Supabase inner join may return as array
            const profiles = task.profiles;
            const profile = Array.isArray(profiles) ? profiles[0] : (profiles as unknown as { line_user_id: string; display_name: string });
            const lineUserId = profile?.line_user_id;

            if (lineUserId) {
                // Send LINE Message
                await lineClient.pushMessage(lineUserId, {
                    type: 'flex',
                    altText: `Reminder: ${task.title}`,
                    contents: {
                        type: 'bubble',
                        header: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                { type: 'text', text: 'Task Reminder', weight: 'bold', color: '#1DB446', size: 'sm' }
                            ]
                        },
                        body: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                { type: 'text', text: task.title, weight: 'bold', size: 'xl', wrap: true },
                                {
                                    type: 'text',
                                    text: `Due: ${new Date(task.due_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
                                    color: '#888888',
                                    size: 'sm',
                                    margin: 'md'
                                }
                            ]
                        },
                        footer: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                {
                                    type: 'button',
                                    action: {
                                        type: 'uri',
                                        label: 'View Task',
                                        uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?action=view-task&taskId=${task.id}`
                                    },
                                    style: 'primary',
                                    color: '#000000'
                                }
                            ]
                        }
                    }
                });
            }

            // Mark as reminded
            await supabaseAdmin
                .from('tasks')
                .update({ reminded: true })
                .eq('id', task.id);

            return task.id;
        }));

        const successCount = results.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({
            success: true,
            processed: tasks.length,
            sent: successCount
        });

    } catch (err: unknown) {
        console.error('Cron Error:', err);
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
