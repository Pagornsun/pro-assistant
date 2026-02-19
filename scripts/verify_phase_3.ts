
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.MOCK_LINE = 'true';

async function verifyPhase3() {
    // Dynamic imports
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { generatePeriodicSummary } = await import('@/lib/gemini');

    console.log('🚀 Starting Phase 3 Verification (Smart Reporting)...');

    // 1. Fetch a Profile
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, line_user_id').limit(1);
    const profile = profiles?.[0];
    if (!profile) {
        console.error('❌ No user found.');
        return;
    }
    console.log(`👤 Testing with User: ${profile.line_user_id}`);

    // 2. Fetch Tasks (Mocking Data)
    const mockTasks = [
        { title: 'Project Launch', status: 'done', priority: 'high' },
        { title: 'Client Meeting', status: 'done', priority: 'medium' },
        { title: 'Write Documentation', status: 'pending', priority: 'medium' }
    ];

    // 3. Mock Events (Simulating Google Calendar)
    const mockEvents = [
        { summary: 'Team Sync', start: { dateTime: new Date().toISOString() } },
        { summary: 'Lunch with boss', start: { dateTime: new Date().toISOString() } }
    ];

    // 4. Generate Weekly Report
    console.log('\n📊 Generating WEEKLY Report...');
    try {
        const weeklyReport = await generatePeriodicSummary(mockTasks, mockEvents, 'weekly');
        console.log('✅ Weekly Report:');
        console.log('--------------------------------------------------');
        console.log(weeklyReport);
        console.log('--------------------------------------------------');
    } catch (e) {
        console.error('❌ Weekly Report Failed:', e);
    }

    // 5. Generate Monthly Report
    console.log('\n📅 Generating MONTHLY Report...');
    try {
        const monthlyReport = await generatePeriodicSummary(mockTasks, mockEvents, 'monthly');
        console.log('✅ Monthly Report:');
        console.log('--------------------------------------------------');
        console.log(monthlyReport);
        console.log('--------------------------------------------------');
    } catch (e) {
        console.error('❌ Monthly Report Failed:', e);
    }
}

verifyPhase3().catch(console.error);
