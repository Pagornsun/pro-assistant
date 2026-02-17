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
            // Auto-create profile
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    line_user_id: lineUserId,
                    tier: 'free'
                })
                .select('id')
                .single();

            if (createError) {
                throw new Error(`Create Profile Error: ${createError.message}`);
            }
            profile = newProfile;

            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ProAssistant ผมสร้างบัญชีให้คุณเรียบร้อยแล้ว!'
            });
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
