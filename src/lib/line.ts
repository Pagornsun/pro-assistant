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

export async function handleLineEvent(event: WebhookEvent) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    const lineUserId = event.source.userId;

    if (!lineUserId) return null;

    // Show loading animation immediately
    await showLoadingAnimation(lineUserId);

    // Hardcoded Command: "New Task" (from Rich Menu) -> Open LIFF
    if (userMessage === 'New Task') {
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
                        {
                            type: 'text',
                            text: 'Create a New Task',
                            weight: 'bold',
                            size: 'xl',
                            align: 'center'
                        },
                        {
                            type: 'text',
                            text: 'Click the button below to open the task form.',
                            margin: 'md',
                            align: 'center',
                            size: 'sm',
                            color: '#666666'
                        }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            style: 'primary',
                            action: {
                                type: 'uri',
                                label: 'Open Task Form',
                                uri: liffUrl
                            },
                            color: '#2563EB'
                        }
                    ]
                }
            }
        });
        return { userId: lineUserId, message: userMessage };
    }

    try {
        // 1. Get or Create Profile
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError && profileError.code === 'PGRST116') {
            // ... (account creation logic remains same) ...
            // Auto-create generic auth user first
            const fakeEmail = `${lineUserId}@line.kinn.com`;

            // 1. Try to fetch existing user first (to avoid duplicates)
            let { data: { users }, error: fetchError } = await supabaseAdmin.auth.admin.listUsers();

            let userId: string | undefined;

            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId }
            });

            if (createError) {
                console.log('Create user failed, trying to find existing...', createError.message);
                const { data: searchResults } = await supabaseAdmin.auth.admin.listUsers();
                const existingUser = searchResults?.users.find(u => u.email === fakeEmail);

                if (existingUser) {
                    userId = existingUser.id;
                } else {
                    throw new Error(`Failed to create and failed to find user: ${createError.message}`);
                }
            } else {
                if (!createdUser.user) throw new Error('Created user is null');
                userId = createdUser.user.id;
            }

            if (!userId) throw new Error('Severe Error: User ID is undefined');

            // Create profile using the Auth ID
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
                if (profileCreateError.code === '23505') {
                    const { data: existingProfile } = await supabaseAdmin
                        .from('profiles').select('id').eq('line_user_id', lineUserId).single();
                    if (existingProfile) profile = existingProfile;
                } else {
                    throw new Error(`Create Profile Error: ${profileCreateError.message}`);
                }
            } else {
                profile = newProfile;
                const welcomeMsg = 'สวัสดีครับ! ยินดีต้อนรับสู่ ProAssistant ผมสร้างบัญชีให้คุณเรียบร้อยแล้ว! (ลองพิมพ์สั่งงานได้เลยครับ)';
                await safeReply(event.replyToken, lineUserId, {
                    type: 'text',
                    text: welcomeMsg
                });
                await saveChatMessage(profile.id, 'assistant', welcomeMsg); // Save welcome message
                return;
            }
        }

        if (!profile) throw new Error('Profile not found and creation failed.');

        // 2. Fetch Chat History
        const history = await getChatHistory(profile.id);

        // 3. Save User Message
        await saveChatMessage(profile.id, 'user', userMessage);

        // 4. Analyze with Gemini (with History)
        let analysis;
        try {
            analysis = await analyzeTask(userMessage, history);
            console.log("Gemini Analysis Result:", analysis);
        } catch (geminiError: any) {
            console.error('Gemini Error:', geminiError);
            const errorMsg = `ระบบ AI ขัดข้องชั่วคราว: ${geminiError.message || 'Unknown Error'}`;
            await safeReply(event.replyToken, lineUserId, {
                type: 'text',
                text: errorMsg
            });
            await saveChatMessage(profile.id, 'assistant', errorMsg);
            return;
        }

        if (analysis.isTask) {
            // 5. Save Task
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
            await safeReply(event.replyToken, lineUserId, {
                type: 'text',
                text: replyMsg
            });
            await saveChatMessage(profile.id, 'assistant', replyMsg);
        }

    } catch (error: any) {
        console.error('Error handling LINE event:', error);
        await safeReply(event.replyToken, lineUserId, {
            type: 'text',
            text: `เกิดข้อผิดพลาด: ${error.message || 'Unknown Error'}`
        });
    }

    return { userId: lineUserId, message: userMessage };
}
