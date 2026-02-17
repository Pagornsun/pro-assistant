import { ClientConfig, Client, WebhookEvent, TextMessage } from '@line/bot-sdk';
import { analyzeTask } from './gemini';
import { supabaseAdmin } from './supabase';

// Hardcoded for safety
const config: ClientConfig = {
    channelAccessToken: 'Ogs1Yy4SaoX+HSQPmriUw9Ck/JS/shIMrEU6wpK/pS9cDeeUIS6Uj0MlJKwJmoCShdUf7YGXkR7a6tpw1+djSYyC/TYKeb/ux0/Fr18UbmX3R0mNrq4mZpnbXyBQ8asiyRSc5Z6qq8+2svq7HIN+fwdB04t89/1O/w1cDnyilFU=',
    channelSecret: '3a36d44e3de97938ce7bdde24d5cac8c',
};

export const lineClient = new Client(config);

export async function handleLineEvent(event: WebhookEvent) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        return null;
    }

    const userMessage = event.message.text;
    const lineUserId = event.source.userId;

    if (!lineUserId) return null;

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
            // Note: listUsers() isn't efficient for lookup, but getUserByEmail isn't exposed in admin api easily in all versions.
            // Better: just try create, if fail, assume exists? No, duplicat email returns error.

            // Actually, we can assume if profile doesn't exist but user might.
            // Let's try to create first.
            let userId: string | undefined;

            const { data: createdUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                email: fakeEmail,
                email_confirm: true,
                user_metadata: { line_user_id: lineUserId }
            });

            if (createError) {
                console.log('Create user failed, trying to find existing...', createError.message);
                // If failed, maybe they exist? invalid email?
                // Try to find the user by email manually if creation failed
                // This is a bit hacky but ensures we get the ID if they exist
                const { data: searchResults, error: searchError } = await supabaseAdmin.auth.admin.listUsers();
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
                    id: userId, // Guaranteed to be string now
                    line_user_id: lineUserId,
                    tier: 'free'
                })
                .select('id')
                .single();

            if (profileCreateError) {
                // If duplicate key, maybe profile existed during race condition?
                if (profileCreateError.code === '23505') {
                    // Fetch again
                    const { data: existingProfile } = await supabaseAdmin
                        .from('profiles').select('id').eq('line_user_id', lineUserId).single();
                    if (existingProfile) profile = existingProfile;
                } else {
                    throw new Error(`Create Profile Error: ${profileCreateError.message}`);
                }
            } else {
                profile = newProfile;
                await lineClient.replyMessage(event.replyToken, {
                    type: 'text',
                    text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ProAssistant ผมสร้างบัญชีให้คุณเรียบร้อยแล้ว! (ลองพิมพ์สั่งงานได้เลยครับ)'
                });
                return; // CRITICAL: Stop here to prevent double-reply error
            }
        }

        if (!profile) throw new Error('Profile not found and creation failed.');

        // 2. Analyze with Gemini
        // Wrap in try-catch specific to Gemini to isolate AI failures
        let analysis;
        try {
            analysis = await analyzeTask(userMessage);
        } catch (geminiError: any) {
            console.error('Gemini Error:', geminiError);
            // Fallback if AI fails
            await lineClient.replyMessage(event.replyToken, {
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

            const reply: TextMessage = {
                type: 'text',
                text: `รับทราบครับ! บันทึกงาน "${analysis.title}" แล้ว\nสถานะ: Pending`
            };
            await lineClient.replyMessage(event.replyToken, reply);
        } else {
            const reply: TextMessage = {
                type: 'text',
                text: `ผมเป็นเลขาช่วยจัดการงานครับ แจ้งให้ผมช่วยจำงานได้เลยนะครับ`
            };
            await lineClient.replyMessage(event.replyToken, reply);
        }

    } catch (error: any) {
        console.error('Error handling LINE event:', error);
        // CRITICAL: Reply with error so user knows what happened
        try {
            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: `เกิดข้อผิดพลาด: ${error.message || 'Unknown Error'}`
            });
        } catch (replyError) {
            console.error('Failed to send error message:', replyError);
        }
    }

    return { userId: lineUserId, message: userMessage };
}
