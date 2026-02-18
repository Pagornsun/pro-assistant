import { ClientConfig, Client, WebhookEvent, TextMessage } from '@line/bot-sdk';
import { analyzeTask, analyzeImage } from './gemini';
import { supabaseAdmin } from './supabase';
import { getTaskFlexMessage } from './flex';

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
        return (client as any)[prop];
    }
});

// We still need the config for other functions, but we access it lazily there too
const getConfig = () => getClientConfig();

// Helper to safely reply
async function safeReply(replyToken: string, userId: string, message: any) {
    try {
        await lineClient.replyMessage(replyToken, message);
    } catch (error: any) {
        console.warn('Reply failed, trying Push...', error.message);
        try {
            await lineClient.pushMessage(userId, message);
        } catch (pushError) {
            console.error('Push also failed:', pushError);
        }
    }
}

// Helper to show loading animation
async function showLoadingAnimation(chatId: string) {
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

// Legacy imports
import { getWelcomeFlexMessage } from './flex-welcome';
import { getOnboardingFlexMessage } from './flex-onboarding';

// Helper: Get or Create Profile
export async function getOrCreateProfile(lineUserId: string) {
    let { data: profile } = await supabaseAdmin.from('profiles').select('id, tutorial_step').eq('line_user_id', lineUserId).single();
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
        .select('id, tutorial_step')
        .single();

    if (error && error.code === '23505') {
        const { data: existing } = await supabaseAdmin.from('profiles').select('id, tutorial_step').eq('line_user_id', lineUserId).single();
        if (!existing) throw new Error('Profile Concurrent Creation Failed');
        return existing;
    }

    if (!newProfile) throw new Error('Profile Insert Failed');

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
            await supabaseAdmin.from('profiles').update({ tutorial_step: 1 }).eq('id', profile.id);
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
        // Reply logic uses replyToken, so it works for groups automatically.
        // Push logic needs to know if it should push to user or group (but safeReply handles replyToken first).

        // 1. Text Message
        if (event.message.type === 'text') {
            const userMessage = event.message.text;

            // In groups, only respond if mentioned or specific keywords (optional, for now respond to all)
            // But to avoid noise, maybe we only respond to known commands or if it looks like a task?
            // For MVP: Respond to everything but maybe add a filter later.

            await showLoadingAnimation(lineUserId); // Animation shows to user? In groups it might not work well for others.

            // Rich Menu Commands
            if (userMessage === 'New Task') {
                const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?action=new-task`;
                // ... (Send Flex)
                return { userId: lineUserId };
            }

            if (/^(help|start|info|menu|สวัสดี|เริ่ม|เริ่มต้น|วิธีใช้)$/i.test(userMessage.trim())) {
                await safeReply(event.replyToken, lineUserId, getWelcomeFlexMessage());
                return { userId: lineUserId };
            }

            // AI Text Analysis
            // Don't save group chat history for now to avoid privacy issues or confusion?
            // Or save with groupId? For now, only save user history context.
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
                });
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: analysis.replyText || 'Bill created.' });
                await saveChatMessage(profile.id, 'assistant', `Created Bill: ${analysis.replyText}`);
            } else if (analysis.isTask) {
                await supabaseAdmin.from('tasks').insert({
                    user_id: profile.id,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'pending',
                    line_group_id: groupId // Save Group ID
                });
                await safeReply(event.replyToken, lineUserId, getTaskFlexMessage(analysis.title, analysis.description));
                await saveChatMessage(profile.id, 'assistant', `Created Task: ${analysis.title}`);
            } else {
                // In groups, maybe don't reply to casual chat unless directly addressed?
                // For MVP, if it's not a task, we reply.
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: analysis.replyText || 'ครับผม' });
                await saveChatMessage(profile.id, 'assistant', analysis.replyText || 'ครับผม');
            }
        }

        // 2. Image Message (Slip Verification)
        else if (event.message.type === 'image') {
            await showLoadingAnimation(lineUserId);

            try {
                const buffer = await getMessageContent(event.message.id);
                // Assume JPEG/PNG
                const analysis = await analyzeImage(buffer, 'image/jpeg');

                if (analysis.is_slip) {
                    const title = `Expense: ${analysis.amount} THB`;
                    const desc = `Date: ${analysis.date || 'Unknown'}\nTo: ${analysis.receiver}\nFrom: ${analysis.sender}`;

                    await supabaseAdmin.from('tasks').insert({
                        user_id: profile.id,
                        title: title,
                        description: desc + '\n(Slip Verified)',
                        status: 'pending', // or 'done' if expense tracking only
                        tags: ['Expense', 'Slip']
                    });

                    await safeReply(event.replyToken, lineUserId, {
                        type: 'text',
                        text: `✅ บันทึกรายจ่ายเรียบร้อยครับ\nยอดเงิน: ${analysis.amount} บาท\nผู้รับ: ${analysis.receiver}`
                    });
                } else {
                    await safeReply(event.replyToken, lineUserId, {
                        type: 'text',
                        text: `ได้รับรูปภาพแล้วครับ แต่ดูเหมือนไม่ใช่สลิปโอนเงิน หรือผมอ่านไม่ออกครับ 😅`
                    });
                }

            } catch (e: any) {
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
                await supabaseAdmin.from('profiles').update({ tutorial_step: 99 }).eq('id', profile.id);
                await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'ยินดีด้วยครับ! คุณพร้อมใช้งาน ProAssistant แล้ว \n\nลองพิมพ์ "ช่วยสรุปงานวันนี้ให้หน่อย" หรือส่งรูปสลิปมาได้เลยครับ' });
            }
            else if (action === 'tutorial_next_1') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 2 }).eq('id', profile.id);
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(2));
            }
            else if (action === 'tutorial_next_2') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 3 }).eq('id', profile.id);
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(3));
            }
            else if (action === 'tutorial_next_3') {
                await supabaseAdmin.from('profiles').update({ tutorial_step: 4 }).eq('id', profile.id);
                await safeReply(event.replyToken, lineUserId, getOnboardingFlexMessage(4));
            }
        }
    }

    return { userId: lineUserId };
}
