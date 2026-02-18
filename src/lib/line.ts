import { ClientConfig, Client, WebhookEvent, TextMessage } from '@line/bot-sdk';
import { analyzeTask } from './gemini';
import { supabaseAdmin } from './supabase';
import { getTaskFlexMessage } from './flex';

// Hardcoded for safety
// Helper to clean the token
const cleanToken = (token: string) => {
    return token.replace(/^(Bearer\s+|LINE_CHANNEL_ACCESS_TOKEN=|"|')+/yi, '').replace(/("|')$/, '').trim();
};

const config: ClientConfig = {
    channelAccessToken: cleanToken(process.env.LINE_CHANNEL_ACCESS_TOKEN || ''),
    channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

export const lineClient = new Client(config);

// Helper to safely reply (fallback to push if token invalid)
async function safeReply(replyToken: string, userId: string, message: any) { // Type 'any' to support FlexMessage and TextMessage
    try {
        await lineClient.replyMessage(replyToken, message);
    } catch (error: any) {
        console.warn('Reply failed, trying Push...', error.message);
        // Fallback to push message if reply token is invalid/expired
        try {
            await lineClient.pushMessage(userId, message);
        } catch (pushError) {
            console.error('Push also failed:', pushError);
        }
    }
}

// Helper to show loading animation
async function showLoadingAnimation(userId: string) {
    try {
        await fetch('https://api.line.me/v2/bot/chat/loading/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.channelAccessToken}`,
            },
            body: JSON.stringify({ chatId: userId, loadingSeconds: 10 }),
        });
    } catch (e) {
        console.error('Loading animation failed (non-fatal):', e);
    }
}

// Helper to get chat history
async function getChatHistory(userId: string): Promise<string> {
    const { data: history } = await supabaseAdmin
        .from('chat_history')
        .select('role, message')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5); // Get last 5 messages

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

import { getWelcomeFlexMessage } from './flex-welcome';

// ... (previous imports)

// Helper: Get or Create Profile
async function getOrCreateProfile(lineUserId: string) {
    // 1. Try to get existing profile
    let { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('line_user_id', lineUserId)
        .single();

    if (profile) return profile;

    // 2. If not found, create Auth User & Profile
    const fakeEmail = `${lineUserId}@line.kinn.com`;

    // Try to find existing auth user first to avoid conflict
    const { data: searchResults } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = searchResults?.users.find(u => u.email === fakeEmail);

    let userId = existingUser?.id;

    if (!userId) {
        const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: fakeEmail,
            email_confirm: true,
            user_metadata: { line_user_id: lineUserId }
        });

        if (createError) throw new Error(`Create Auth Error: ${createError.message}`);
        userId = createdUser.user?.id;
    }

    if (!userId) throw new Error('User ID is undefined after creation');

    // Create Profile
    const { data: newProfile, error: profileCreateError } = await supabaseAdmin
        .from('profiles')
        .insert({
            id: userId,
            line_user_id: lineUserId,
            tier: 'free'
        })
        .select('id')
        .single();

    if (profileCreateError) {
        // Race condition check
        if (profileCreateError.code === '23505') {
            const { data: existing } = await supabaseAdmin
                .from('profiles').select('id').eq('line_user_id', lineUserId).single();
            if (existing) return existing;
        }
        throw new Error(`Create Profile Error: ${profileCreateError.message}`);
    }

    return newProfile;
}

export async function handleLineEvent(event: WebhookEvent) {
    const lineUserId = event.source.userId;
    if (!lineUserId) return null;

    // 1. Handle "Follow" Event (User adds bot)
    if (event.type === 'follow') {
        console.log(`[Follow] New user: ${lineUserId}`);
        try {
            await showLoadingAnimation(lineUserId);
            const profile = await getOrCreateProfile(lineUserId);

            // Send Welcome Message
            await safeReply(event.replyToken, lineUserId, getWelcomeFlexMessage());
            await saveChatMessage(profile.id, 'assistant', '[Sent Welcome Message]');
            return { userId: lineUserId, type: 'follow' };
        } catch (e: any) {
            console.error('[Follow] Error:', e);
            return null;
        }
    }

    // 2. Handle Text Messages
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;

    // Show loading animation immediately
    await showLoadingAnimation(lineUserId);

    // Hardcoded Command: "New Task" (Rich Menu)
    if (userMessage === 'New Task') {
        // ... (Existing New Task logic - keep as is or can use getWelcomeFlexMessage if needed, but likely specific logic)
        // For now, let's keep the existing logic or redirect to the same URI logic if needed.
        // The user specifically asked for "New Task" to open modal. 
        // We already fixed the Rich Menu to use URI, so this code might effectively be dead code for the button 
        // BUT if user Types "New Task" manually, we should still handle it.
        const liffUrl = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID}?action=new-task`;
        await safeReply(event.replyToken, lineUserId, {
            type: 'flex',
            altText: 'Create New Task',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: 'text', text: 'Create a New Task', weight: 'bold', size: 'xl', align: 'center' },
                        { type: 'text', text: 'Click the button below to open the task form.', margin: 'md', align: 'center', size: 'sm', color: '#666666' }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: 'button', style: 'primary', action: { type: 'uri', label: 'Open Task Form', uri: liffUrl }, color: '#2563EB' }
                    ]
                }
            }
        });
        return { userId: lineUserId, message: userMessage };
    }

    // Handle "Help", "Start", "Info" -> Welcome Message
    if (/^(help|start|info|menu|สวัสดี|เริ่ม|เริ่มต้น|วิธีใช้)$/i.test(userMessage.trim())) {
        try {
            const profile = await getOrCreateProfile(lineUserId);
            await safeReply(event.replyToken, lineUserId, getWelcomeFlexMessage());
            await saveChatMessage(profile.id, 'assistant', '[Sent Welcome Message]');
            return { userId: lineUserId, message: userMessage };
        } catch (e: any) {
            console.error('[Help] Error:', e);
            await safeReply(event.replyToken, lineUserId, { type: 'text', text: 'Error loading help.' });
            return null;
        }
    }

    try {
        // 3. Normal AI Chat Flow
        const profile = await getOrCreateProfile(lineUserId);

        // Fetch Chat History
        const history = await getChatHistory(profile.id);

        // Save User Message
        await saveChatMessage(profile.id, 'user', userMessage);

        // Analyze with Gemini
        let analysis;
        try {
            analysis = await analyzeTask(userMessage, history);
        } catch (geminiError: any) {
            console.error('Gemini Error:', geminiError);
            const errorMsg = `ระบบ AI ขัดข้องชั่วคราว: ${geminiError.message || 'Unknown Error'}`;
            await safeReply(event.replyToken, lineUserId, { type: 'text', text: errorMsg });
            await saveChatMessage(profile.id, 'assistant', errorMsg);
            return;
        }

        if (analysis.isTask) {
            const { error: taskError } = await supabaseAdmin
                .from('tasks')
                .insert({
                    user_id: profile.id,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'pending'
                });

            if (taskError) throw new Error(`Save Task Error: ${taskError.message}`);

            await safeReply(event.replyToken, lineUserId, getTaskFlexMessage(analysis.title, analysis.description));
            await saveChatMessage(profile.id, 'assistant', `Created Task: ${analysis.title}`);
        } else {
            const replyMsg = analysis.replyText || 'ผมเป็นเลขาช่วยจัดการงานครับ แจ้งให้ผมช่วยจำงานได้เลยนะครับ';
            await safeReply(event.replyToken, lineUserId, { type: 'text', text: replyMsg });
            await saveChatMessage(profile.id, 'assistant', replyMsg);
        }

    } catch (error) {
        console.error('[handleLineEvent] Unexpected error:', error);
        // Send a generic message — do NOT expose internal error details to users
        await safeReply(event.replyToken, lineUserId, {
            type: 'text',
            text: 'ขออภัย เกิดข้อผิดพลาดชั่วคราว กรุณาลองใหม่อีกครั้งครับ 🙏'
        });
    }

    return { userId: lineUserId, message: userMessage };
}
