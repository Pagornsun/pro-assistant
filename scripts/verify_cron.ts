
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.MOCK_LINE = 'true';

async function verifyCron() {
    // Dynamic imports
    const { supabaseAdmin } = await import('@/lib/supabase');
    const { generateBriefing } = await import('@/lib/gemini');
    // We don't import the route.ts directly because of NextRequest dependence.
    // We re-implement the core logic here to verify valid DB queries and AI response.

    console.log('🚀 Starting Daily Briefing Verification...');

    // 1. Fetch a Profile
    const { data: profiles } = await supabaseAdmin.from('profiles').select('id, line_user_id').limit(1);
    if (!profiles || profiles.length === 0) {
        console.error('❌ No profiles found.');
        return;
    }
    const profile = profiles[0];
    console.log(`👤 Testing with User: ${profile.line_user_id}`);

    // 2. Fetch Tasks (Simulate "Today")
    // For test purposes, we'll just fetch *any* pending tasks to see if briefing generates.
    const { data: tasks } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'pending')
        .limit(3);

    console.log(`📋 Found ${tasks?.length || 0} pending tasks.`);

    if (tasks && tasks.length > 0) {
        // 3. Generate Briefing
        console.log('🤖 Generating Briefing...');
        try {
            const briefing = await generateBriefing(tasks);
            console.log('✅ Briefing Generated:');
            console.log('--------------------------------------------------');
            console.log(briefing);
            console.log('--------------------------------------------------');
        } catch (e) {
            console.error('❌ Briefing Generation Failed:', e);
        }
    } else {
        console.log('⚠️ No tasks to generate briefing from. Skipping AI generation check.');

        // Create a dummy task to force test?
        console.log('🤖 Generating Briefing from DUMMY data...');
        const dummyTasks = [{ title: 'Test Task 1', priority: 'high' }, { title: 'Test Task 2', priority: 'medium' }];
        const briefing = await generateBriefing(dummyTasks);
        console.log('✅ Dummy Briefing Generated:', briefing);
    }
}

verifyCron().catch(console.error);
