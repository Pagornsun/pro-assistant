const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🚀 Setting up test data for Due Date Alert...');

    // 1. Get a user
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, line_user_id')
        .limit(1);

    if (profileError || !profiles || profiles.length === 0) {
        console.error('❌ No profiles found. Cannot create test task.');
        return;
    }

    const user = profiles[0];
    console.log(`👤 Using profile: ${user.id} (LINE: ${user.line_user_id})`);

    // 2. Create a task due in 60 minutes
    const dueTime = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    const { data: task, error: taskError } = await supabase
        .from('tasks')
        .insert({
            user_id: user.id,
            title: 'Test Task (Due in 1h)',
            description: 'This task should trigger a 1h reminder.',
            status: 'pending',
            due_date: dueTime,
            is_reminded_1h: false,
            is_reminded_24h: false
        })
        .select()
        .single();

    if (taskError) {
        console.error('❌ Failed to create task:', taskError);
        return;
    }

    console.log(`✅ Created Task ID: ${task.id}`);
    console.log(`📅 Due Date: ${task.due_date}`);
    console.log('\n--- HOW TO VERIFY ---');
    console.log('1. Run the Cron API manually via curl:');
    console.log(`   curl -H "Authorization: Bearer ${process.env.CRON_SECRET}" http://localhost:3000/api/cron/check-due-dates`);
    console.log('\n2. Check if you received a LINE notification.');
    console.log('3. Check if is_reminded_1h became TRUE in DB.');
}

main();
