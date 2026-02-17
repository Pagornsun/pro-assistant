import { ClientConfig, Client, WebhookEvent, TextMessage } from '@line/bot-sdk';
import { analyzeTask } from './gemini';
import { supabaseAdmin } from './supabase';

const cleanEnv = (key: string | undefined) => key ? key.replace(/"/g, '').trim() : '';

const config: ClientConfig = {
    channelAccessToken: cleanEnv(process.env.LINE_CHANNEL_ACCESS_TOKEN),
    channelSecret: cleanEnv(process.env.LINE_CHANNEL_SECRET),
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
            // Auto-create profile for new LINE user
            const { data: newProfile, error: createError } = await supabaseAdmin
                .from('profiles')
                .insert({
                    line_user_id: lineUserId,
                    tier: 'free'
                })
                .select('id')
                .single();

            if (createError) {
                console.error('Error auto-registering user:', createError);
                return null;
            }
            profile = newProfile;

            // Welcome message for first-time users
            await lineClient.replyMessage(event.replyToken, {
                type: 'text',
                text: 'สวัสดีครับ! ยินดีต้อนรับสู่ ProAssistant ผมได้สร้างบัญชีให้คุณเรียบร้อยแล้ว ตอนนี้คุณสามารถสั่งงานผมได้ทันทีเลยครับ!'
            });
            // We return early here or continue to process the message as a task
        }

        if (!profile) return null;

        // 2. Analyze with Gemini
        const analysis = await analyzeTask(userMessage);

        if (analysis.isTask) {
            // 3. Save Task to Supabase
            const { data: task, error: taskError } = await supabaseAdmin
                .from('tasks')
                .insert({
                    user_id: profile.id,
                    title: analysis.title,
                    description: analysis.description,
                    status: 'pending'
                })
                .select()
                .single();

            if (taskError) throw taskError;

            // 4. Reply to User
            const reply: TextMessage = {
                type: 'text',
                text: `รับทราบครับ! ผมได้บันทึกงาน "${analysis.title}" เรียบร้อยแล้ว\nสถานะ: Pending\nคุณสามารถดูรายละเอียดได้ที่ Dashboard ครับ`
            };
            await lineClient.replyMessage(event.replyToken, reply);
        } else {
            // Not a task, maybe a general chat or question
            const reply: TextMessage = {
                type: 'text',
                text: `ขออภัยครับ ผมเป็นเลขาอัตโนมัติที่ช่วยจัดการงานเท่านั้น หากต้องการให้ช่วยเรื่องอะไร สามารถระบุงานที่ต้องการได้เลยครับ (เช่น "ช่วยจองร้านอาหาร...")`
            };
            await lineClient.replyMessage(event.replyToken, reply);
        }

    } catch (error) {
        console.error('Error handling LINE event:', error);
    }

    return {
        userId: lineUserId,
        message: userMessage
    };
}
