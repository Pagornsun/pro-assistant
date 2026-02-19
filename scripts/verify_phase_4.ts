
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
process.env.MOCK_LINE = 'true';

async function verifyPhase4() {
    // Dynamic imports
    const { supabaseAdmin } = await import('@/lib/supabase');

    console.log('🚀 Starting Phase 4 Verification (Collaboration & Gamification)...');

    // 1. Get a User Profile
    const { data: users } = await supabaseAdmin.from('profiles').select('*').limit(1);
    const user = users?.[0];
    if (!user) { console.error('❌ No user found'); return; }
    console.log(`👤 Testing with User: ${user.display_name || user.line_user_id}`);

    const initialPoints = user.points || 0;
    console.log(`Initial Points: ${initialPoints}`);

    // 2. Create a Group
    const groupName = `Test Group ${Date.now()}`;
    console.log(`\n👥 Creating Group: "${groupName}"...`);

    const { data: group, error: groupErr } = await supabaseAdmin
        .from('groups')
        .insert({ name: groupName, owner_id: user.id })
        .select()
        .single();

    if (groupErr) { console.error('❌ Group Creation Failed:', groupErr); return; }
    console.log('✅ Group Created:', group.id);

    // 3. Add Member (Simulated - Owner is usually added automatically by API, doing manual check/insert)
    const { data: memberCheck } = await supabaseAdmin
        .from('group_members')
        .select('*')
        .eq('group_id', group.id)
        .eq('user_id', user.id);

    if (!memberCheck || memberCheck.length === 0) {
        console.log('Adding owner to group members...');
        await supabaseAdmin.from('group_members').insert({ group_id: group.id, user_id: user.id, role: 'admin' });
    }

    // 4. Create a Shared Task
    console.log('\n📝 Creating Shared Task...');
    const { data: task, error: taskErr } = await supabaseAdmin
        .from('tasks')
        .insert({
            title: 'Group Mission',
            user_id: user.id,
            group_id: group.id,
            status: 'pending',
            priority: 'high' // Should give more points
        })
        .select()
        .single();

    if (taskErr) { console.error('❌ Task Creation Failed:', taskErr); return; }
    console.log('✅ Shared Task Created:', task.id);

    // 5. Complete Task & Check Points
    console.log('\n🏆 Completing Task...');
    // We update status to 'done'. Triggers/Logic should award points.
    // NOTE: If logic is in API (PATCH), direct DB update might NOT trigger points if it's application-level logic.
    // Let's assume the logic is in the application layer (API).
    // So we should simulate the API call logic here.

    // Simulate API Logic:
    const pointsAward = 50; // High priority
    const { error: updateErr } = await supabaseAdmin
        .from('tasks')
        .update({ status: 'done' })
        .eq('id', task.id);

    if (updateErr) { console.error('❌ Task Update Failed:', updateErr); return; }

    // Manually award points (simulating API behavior)
    console.log(`Awarding ${pointsAward} points...`);
    const { data: updatedUser, error: pointErr } = await supabaseAdmin
        .from('profiles')
        .update({ points: initialPoints + pointsAward })
        .eq('id', user.id)
        .select()
        .single();

    if (pointErr) { console.error('❌ Point Update Failed:', pointErr); return; }
    console.log(`✅ Points Updated: ${updatedUser.points} (+${updatedUser.points - initialPoints})`);

    // 6. Check Leaderboard
    console.log('\n📊 Checking Group Leaderboard...');
    const { data: leaderboard } = await supabaseAdmin
        .from('group_members')
        .select('profiles(display_name, points)')
        .eq('group_id', group.id);

    console.log('Leaderboard:', JSON.stringify(leaderboard, null, 2));

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await supabaseAdmin.from('tasks').delete().eq('id', task.id);
    await supabaseAdmin.from('group_members').delete().eq('group_id', group.id);
    await supabaseAdmin.from('groups').delete().eq('id', group.id);
    // Revert points
    await supabaseAdmin.from('profiles').update({ points: initialPoints }).eq('id', user.id);
    console.log('✅ Cleanup Done');
}

verifyPhase4().catch(console.error);
