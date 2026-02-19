import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { lineClient } from '@/lib/line';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    // 1. Security Check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 2. Get all users with LINE ID
        const { data: profiles, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, line_user_id, display_name')
            .not('line_user_id', 'is', null);

        if (profileError || !profiles) {
            throw new Error(profileError?.message || 'No profiles found');
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const results = await Promise.allSettled(profiles.map(async (profile) => {
            if (!profile.line_user_id) return;

            // 3. Get Pending Tasks for this user
            const { data: tasks } = await supabaseAdmin
                .from('tasks')
                .select('title')
                .eq('user_id', profile.id)
                .in('status', ['pending', 'processing'])
                .order('due_date', { ascending: true }) // Urgent first
                .limit(3);

            const taskCount = tasks?.length || 0;

            if (taskCount > 0) {
                // Determine greeting
                const hour = new Date().getHours();
                const greeting = hour < 12 ? 'Good Morning! ☀️' : 'Hello! 👋';

                const taskList = tasks!.map(t => `• ${t.title}`).join('\n');
                const moreText = taskCount > 3 ? `\n...and more.` : '';

                // Send Flex Message
                await lineClient.pushMessage(profile.line_user_id, {
                    type: 'flex',
                    altText: `${greeting} You have ${taskCount} tasks pending.`,
                    contents: {
                        type: 'bubble',
                        header: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                { type: 'text', text: greeting, weight: 'bold', color: '#1DB446', size: 'lg' }
                            ]
                        },
                        body: {
                            type: 'box',
                            layout: 'vertical',
                            contents: [
                                { type: 'text', text: `You have ${taskCount} pending tasks today.`, weight: 'bold', size: 'md', wrap: true },
                                { type: 'separator', margin: 'md' },
                                {
                                    type: 'text',
                                    text: taskList + moreText,
                                    wrap: true,
                                    margin: 'md',
                                    size: 'sm',
                                    color: '#555555',
                                    lineSpacing: '4px'
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
                                        label: 'View Dashboard',
                                        uri: `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?redirect=/dashboard`
                                    },
                                    style: 'primary',
                                    color: '#000000',
                                    height: 'sm'
                                }
                            ]
                        }
                    }
                });
                return { userId: profile.id, status: 'sent', count: taskCount };
            }
            return { userId: profile.id, status: 'skipped' };
        }));

        const sent = results.filter(r => r.status === 'fulfilled' && r.value?.status === 'sent').length;

        return NextResponse.json({ success: true, sent, total: profiles.length });

    } catch (err: unknown) {
        console.error('Morning Brief Error:', err);
        return NextResponse.json({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
    }
}
