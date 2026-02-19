import { ClientConfig, Client, WebhookEvent, TextMessage, Message } from '@line/bot-sdk';
import { analyzeTask, analyzeImage, generateBriefing } from './gemini';
import { supabaseAdmin } from './supabase';
import { getTaskFlexMessage, getBriefingFlexMessage } from './flex';
import { getWelcomeFlexMessage } from './flex-welcome';
import { getOnboardingFlexMessage } from './flex-onboarding';

// Helper to clean the token
export const cleanToken = (token: string) => {
    return token.replace(/^(Bearer\s+|LINE_CHANNEL_ACCESS_TOKEN=|"|')+/yi, '').replace(/("|')$/, '').trim();
};

const getClientConfig = (): ClientConfig => ({
    channelAccessToken: cleanToken(process.env.LINE_CHANNEL_ACCESS_TOKEN || ''),
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
});

// Lazy initialization for the client to avoid build-time errors
export const lineClient = new Proxy({} as Client, {
    get: (_target, prop) => {
        const client = new Client(getClientConfig());
        return (client as unknown as Record<string | symbol, unknown>)[prop];
    }
});

// We still need the config for other functions, but we access it lazily there too
const getConfig = () => getClientConfig();

// Helper to safely reply
async function safeReply(replyToken: string, userId: string, message: Message | Message[]) {
    if (process.env.MOCK_LINE) {
        console.log(`[Mock Reply] To ${userId}:`, JSON.stringify(message, null, 2));
        return;
    }
    try {
        await lineClient.replyMessage(replyToken, message);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('Reply failed, trying Push...', errorMessage);
        try {
            await lineClient.pushMessage(userId, message);
        } catch (pushError) {
            console.error('Push also failed:', pushError);
        }
    }
}

// Helper to show loading animation
async function showLoadingAnimation(chatId: string) {
    if (process.env.MOCK_LINE) return;
    try {
        await fetch('https://api.line.me/v2/bot/chat/loading/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getConfig().channelAccessToken}`,
            },
            body: JSON.stringify({ chatId, loadingSeconds: 20 }), // Longer for image
        });
    } catch (e) {
        console.error('Loading animation failed:', e);
    }
}

// Helper to get chat history
async function getChatHistory(userId: string): Promise<string> {
    const { data: history } = await supabaseAdmin
        .from('chat_history')
        .select('role, message')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

    if (!history || history.length === 0) return '';
    return history.reverse().map(h => `${h.role}: ${h.message}`).join('\n');
}

// Helper to save chat message
async function saveChatMessage(userId: string, role: 'user' | 'assistant', message: string) {
    await supabaseAdmin.from('chat_history').insert({
        user_id: userId,
        role: role,
        message: message
    });
}

// Helper: Get or Create Profile
export async function getOrCreateProfile(lineUserId: string) {
    const { data: profile } = await supabaseAdmin.from('profiles').select('id, tutorial_step, tier').eq('line_user_id', lineUserId).single();
    if (profile) return profile;

    // Create Auth User & Profile
    const fakeEmail = `${lineUserId}@line.kinn.com`;
    const { data: searchResults } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = searchResults?.users.find(u => u.email === fakeEmail);
    let userId = existingUser?.id;

    if (!userId) {
        const { data: createdUser } = await supabaseAdmin.auth.admin.createUser({
            email: fakeEmail,
            email_confirm: true,
            user_metadata: { line_user_id: lineUserId }
        });
        userId = createdUser.user?.id;
    }

    if (!userId) throw new Error('User Creation Failed');

    const { data: newProfile, error } = await supabaseAdmin
        .from('profiles')
        .insert({ id: userId, line_user_id: lineUserId, tier: 'free' })
        .select('id, tutorial_step, tier')
        .single();

    if (error && error.code === '23505') {
        const { data: existing } = await supabaseAdmin.from('profiles').select('id, tutorial_step, tier').eq('line_user_id', lineUserId).single();
        if (!existing) throw new Error('Profile Concurrent Creation Failed');
        return existing;
    }

    if (error || !newProfile) {
        console.error('[Webhook] Profile Creation Error:', error);
        throw new Error(`Profile Insert Failed: ${error?.message || 'Unknown error'}`);
    }

    return newProfile;
}

// Helper: Download Content
export async function getMessageContent(messageId: string): Promise<Buffer> {
    const stream = await lineClient.getMessageContent(messageId);
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on('error', (err) => reject(err));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

export async function handleLineEvent(event: WebhookEvent) {
    const lineUserId = event.source.userId;
    if (!lineUserId) return null;

    // Handle Follow
    if (event.type === 'follow') {
        await showLoadingAnimation(lineUserId);
        const profile = await getOrCreateProfile(lineUserId);

        // Check if user has already assigned a tutorial step (optional, but good for re-following)
        if (!profile.tutorial_step || profile.tutorial_step === 0) {
            await supabaseAdmin.from('profiles').update({ tutorial_step: 1 }).eq('id', profile.id).throwOnError();
            await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(1));
        } else {
            await safeReply(event.replyToken, lineUserId, getWelcomeFlexMessage());
        }
        return { userId: lineUserId, type: 'follow' };
    }

    // Handle Message
    if (event.type === 'message') {
        const profile = await getOrCreateProfile(lineUserId);

        let groupId: string | undefined = undefined;
        if (event.source.type === 'group') {
            groupId = event.source.groupId;
        } else if (event.source.type === 'room') {
            groupId = event.source.roomId;
        }

        // 1. Text Message
        if (event.message.type === 'text') {
            const userMessage = event.message.text;

            await showLoadingAnimation(lineUserId);

            // Rich Menu Commands
            if (userMessage === 'New Task') {
                // Return simple liff link or something
                return { userId: lineUserId };
            }

            if (/^(help|start|info|menu|สวัสดี|เริ่ม|เริ่มต้น|วิธีใช้)$/i.test(userMessage.trim())) {
                await safeReply(event.replyToken, lineUserId, getWelcomeFlexMessage());
                return { userId: lineUserId };
            }

            if (/^(summary|briefing|สรุป|สรุปงาน|ช่วยสรุปงาน)$/i.test(userMessage.trim())) {
                const now = new Date();
                const today = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
                today.setHours(0, 0, 0, 0);
                const tonight = new Date(today);
                tonight.setHours(23, 59, 59, 999);

                const { data: tasks } = await supabaseAdmin
                    .from('tasks')
                    .select('*')
                    .eq('user_id', profile.id)
                    .eq('status', 'pending')
                    .gte('due_date', today.toISOString())
                    .lte('due_date', tonight.toISOString());

                if (tasks && tasks.length > 0) {
                    const briefingText = await generateBriefing(tasks);
                    const flex = getBriefingFlexMessage(briefingText, tasks.length);
                    await safeReply(event.replyToken, lineUserId, flex);
                } else {
                    await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'วันนี้ยังไม่มีงานในกำหนดส่งครับ พักผ่อนได้เต็มที่เลย! 😎' });
                }
                return { userId: lineUserId };
            }

            // AI Text Analysis
            await saveChatMessage(profile.id, 'user', userMessage);
            const history = await getChatHistory(profile.id);
            const analysis = await analyzeTask(userMessage, history);

            if (analysis.isBillSplit) {
                await supabaseAdmin.from('tasks').insert({
                    user_id: profile.id,
                    title: `Bill: ${analysis.billDetails?.total} ${analysis.billDetails?.currency}`,
                    description: `Split with ${analysis.billDetails?.people_count} people.\nPayers: ${analysis.billDetails?.payers?.join(', ') || 'Everyone'}`,
                    status: 'pending_payment',
                    line_group_id: groupId,
                    bill_split_details: analysis.billDetails
                }).throwOnError();
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: analysis.replyText || 'Bill created.' });
                await saveChatMessage(profile.id, 'assistant', `Created Bill: ${analysis.replyText}`);
            } else if (analysis.isTask) {
                const { data: newTask, error: insertError } = await supabaseAdmin.from('tasks').insert({
                    user_id: profile.id,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'pending',
                    due_date: analysis.due_date || null,
                    tags: analysis.tags || [],
                    priority: analysis.priority || 'medium',
                    line_group_id: groupId
                }).select('id').single();

                if (insertError) throw insertError;

                await safeReply(event.replyToken, lineUserId, getTaskFlexMessage(analysis.title, analysis.description, newTask.id));
                await saveChatMessage(profile.id, 'assistant', `Created Task: ${analysis.title}`);
            } else {
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: analysis.replyText || 'ครับผม' });
                await saveChatMessage(profile.id, 'assistant', analysis.replyText || 'ครับผม');
            }
        }

        // 2. Image Message (Slip Verification)
        else if (event.message.type === 'image') {
            await showLoadingAnimation(lineUserId);

            try {
                const buffer = await getMessageContent(event.message.id);
                const analysis = await analyzeImage(buffer, 'image/jpeg');

                if (analysis.is_slip) {
                    const title = `Expense: ${analysis.amount} THB`;
                    const desc = `Date: ${analysis.date || 'Unknown'}\nTo: ${analysis.receiver}\nFrom: ${analysis.sender}`;

                    await supabaseAdmin.from('tasks').insert({
                        user_id: profile.id,
                        title: title,
                        description: desc + '\n(Slip Verified)',
                        status: 'pending',
                        tags: ['Expense', 'Slip']
                    }).throwOnError();

                    await safeReply(event.replyToken, lineUserId, {
                        type: 'text',
                        text: `✅ บันทึกรายจ่ายเรียบร้อยครับ\nยอดเงิน: ${analysis.amount} บาท\nผู้รับ: ${analysis.receiver}`
                    });
                } else if (analysis.is_task && analysis.extracted_tasks?.length > 0) {
                    const tasks = analysis.extracted_tasks;
                    for (const task of tasks) {
                        await supabaseAdmin.from('tasks').insert({
                            user_id: profile.id,
                            title: task.title,
                            description: task.description,
                            status: 'pending',
                            due_date: task.due_date || null,
                            tags: ['OCR', 'Auto-created']
                        }).throwOnError();
                    }

                    await safeReply(event.replyToken, lineUserId, {
                        type: 'text',
                        text: `✅ อ่านข้อมูลจากรูปภาพและบันทึกงานใหม่ให้ ${tasks.length} รายการแล้วครับ`
                    });
                } else {
                    await safeReply(event.replyToken, lineUserId, {
                        type: 'text',
                        text: `ได้รับรูปภาพแล้วครับ แต่ดูเหมือนไม่มีข้อมูลงานหรือสลิปที่ผมอ่านได้ครับ 😅`
                    });
                }

            } catch (e: unknown) {
                console.error('Image Processing Error:', e);
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'ขออภัย เกิดข้อผิดพลาดในการอ่านรูปครับ' });
            }
        }
    }

    // Handle Postback (Tutorial Navigation)
    if (event.type === 'postback') {
        const data = new URLSearchParams(event.postback.data);
        const action = data.get('action');

        if (action?.startsWith('tutorial_')) {
            const profile = await getOrCreateProfile(lineUserId);

            if (action === 'tutorial_skip' || action === 'tutorial_finish') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 99 }).eq('id', profile.id).throwOnError();
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'ยินดีด้วยครับ! คุณพร้อมใช้งาน ProAssistant แล้ว \n\nลองพิมพ์ "ช่วยสรุปงานวันนี้ให้หน่อย" หรือส่งรูปสลิปมาได้เลยครับ' });
            }
            else if (action === 'tutorial_next_1') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 2 }).eq('id', profile.id).throwOnError();
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(2));
            }
            else if (action === 'tutorial_next_2') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 3 }).eq('id', profile.id).throwOnError();
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(3));
            }
            else if (action === 'tutorial_next_3') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 4 }).eq('id', profile.id).throwOnError();
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(4));
            }
        }
        else if (action === 'task_done') {
            const taskId = data.get('id');
            if (taskId) {
                await supabaseAdmin.from('tasks').update({ status: 'done' }).eq('id', taskId).throwOnError();
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'เก่งมากครับ! ติ๊กถูกงานนี้ให้แล้วครับ ✅' });
            }
        }
    }

    return { userId: lineUserId };
}
