import { ClientConfig, Client, WebhookEvent, TextMessage } from '@line/bot-sdk';
import { analyzeTask } from './gemini';
import { supabaseAdmin } from './supabase';

// Hardcoded for safety
const config: ClientConfig = {
    channelAccessToken: 'Ogs1Yy4SaoX+HSQPmriUw9Ck/JS/shIMrEU6wpK/pS9cDeeUIS6Uj0MlJKwJmoCShdUf7YGXkR7a6tpw1+djSYyC/TYKeb/ux0/Fr18UbmX3R0mNrq4mZpnbXyBQ8asiyRSc5Z6qq8+2svq7HIN+fwdB04t89/1O/w1cDnyilFU=',
    channelSecret: '3a36d44e3de97938ce7bdde24d5cac8c',
};

export const lineClient = new Client(config);

// Helper to safely reply (fallback to push if token invalid)
async function safeReply(replyToken: string, userId: string, message: TextMessage) {
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

export async function handleLineEvent(event: WebhookEvent) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    const lineUserId = event.source.userId;

    if (!lineUserId) return null;

    // Show loading animation immediately
    await showLoadingAnimation(lineUserId);

    try {
        // 1. Get or Create Profile
        let { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('line_user_id', lineUserId)
            .single();

        if (profileError && profileError.code === 'PGRST116') {
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
                await safeReply(event.replyToken, lineUserId, {
                    type: 'text',
                    text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ProAssistant ผมสร้างบัญชีให้คุณเรียบร้อยแล้ว! (ลองพิมพ์สั่งงานได้เลยครับ)'
                });
                return; // CRITICAL: Stop here to prevent double-reply error
            }
        }

        if (!profile) throw new Error('Profile not found and creation failed.');

        // 2. Analyze with Gemini
        let analysis;
        try {
            analysis = await analyzeTask(userMessage);
            console.log("Gemini Analysis Result:", analysis);
        } catch (geminiError: any) {
            console.error('Gemini Error:', geminiError);
            await safeReply(event.replyToken, lineUserId, {
                type: 'text',
                text: `ระบบ AI ขัดข้องชั่วคราว: ${geminiError.message || 'Unknown Error'}`
            });
            return;
        }

        if (analysis.isTask) {
            // 3. Save Task
            const { error: taskError } = await supabaseAdmin
                .from('tasks')
                .insert({
                    user_id: profile.id,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'pending'
                });

            if (taskError) throw new Error(`Save Task Error: ${taskError.message}`);

            await safeReply(event.replyToken, lineUserId, {
                type: 'text',
                text: `รับทราบครับ! บันทึกงาน "${analysis.title}" แล้ว\nสถานะ: Pending`
            });
        } else {
            await safeReply(event.replyToken, lineUserId, {
                type: 'text',
                text: analysis.replyText || 'ผมเป็นเลขาช่วยจัดการงานครับ แจ้งให้ผมช่วยจำงานได้เลยนะครับ'
            });
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
