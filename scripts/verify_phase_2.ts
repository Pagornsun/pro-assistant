import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.MOCK_LINE = 'true';

// Mock Webhook Event
const createMockEvent = (userId: string, text: string): any => ({
    type: 'message',
    replyToken: 'mock_reply_token',
    source: { userId, type: 'user' },
    message: { type: 'text', id: 'mock_msg_id', text }
});

// Dynamic imports to ensure env vars are loaded first
async function runTests() {
    const { handleLineEvent } = await import('@/lib/line');
    const { supabaseAdmin } = await import('@/lib/supabase');

    console.log('🚀 Starting Phase 2 Verification...');

    // 1. Get a distinct user ID
    // We'll trust the first profile found, or fail if none.
    const { data: profile } = await supabaseAdmin.from('profiles').select('line_user_id').limit(1).single();

    const userId = profile?.line_user_id || 'U1234567890abcdef1234567890abcdef'; // Fallback mock ID
    console.log(`👤 Using Display User ID: ${userId}`);

    // DEBUG: Check tasks schema
    console.log('🔍 Debugging Tasks Table...');
    const { data: debugTasks, error: debugError } = await supabaseAdmin.from('tasks').select('*').limit(1);
    if (debugError) {
        console.error('❌ Debug Select Failed:', debugError);
    } else {
        console.log('✅ Debug Select Success (Keys):', debugTasks && debugTasks[0] ? Object.keys(debugTasks[0]) : 'No rows found');
        if (debugTasks && debugTasks.length > 0) {
            console.log('Sample Row:', debugTasks[0]);
        }
    }

    // --- Test 1: General Chat ---
    console.log('\n🧪 Test 1: General Chat ("สวัสดีครับ")');
    await handleLineEvent(createMockEvent(userId, 'สวัสดีครับ'));
    console.log('✅ AI processed general chat (check logs/DB)');

    // --- Test 2: Smart Task ---
    console.log('\n🧪 Test 2: Smart Task ("ประชุม Marketing พรุ่งนี้ 10 โมง")');
    await handleLineEvent(createMockEvent(userId, 'ประชุม Marketing พรุ่งนี้ 10 โมง'));

    // Verify DB
    const { data: tasks } = await supabaseAdmin.from('tasks')
        .select('*')
        .ilike('title', '%Marketing%')
        .order('created_at', { ascending: false })
        .limit(1);

    if (tasks && tasks.length > 0) {
        console.log('✅ Task Created:', tasks[0]);
    } else {
        console.error('❌ Task Creation FAILED');
    }

    // --- Test 3: Bill Split ---
    console.log('\n🧪 Test 3: Bill Split ("ค่าปาร์ตี้ 3000 หาร 6")');
    await handleLineEvent(createMockEvent(userId, 'ค่าปาร์ตี้ 3000 หาร 6'));

    const { data: bills } = await supabaseAdmin.from('tasks')
        .select('*')
        .ilike('title', '%Bill%')
        .order('created_at', { ascending: false })
        .limit(1);

    if (bills && bills.length > 0) {
        console.log('✅ Bill Created:', bills[0]);
    } else {
        console.error('❌ Bill Creation FAILED');
    }
}

// Execute
runTests().catch(console.error);
