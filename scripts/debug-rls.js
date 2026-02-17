
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = fs.readFileSync(envPath, 'utf8');
const env = {};
envConfig.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        env[key.trim()] = value;
    }
});

// Use ANON KEY (Client Side Simulation)
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const targetLineUserId = 'U05141508db8b0f20485987309990833a'; // Example ID from debug output or generic

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testAccess() {
    console.log('Testing Client-Side Access (Anon Key)...');

    // Test 1: Query Profiles
    const { data: profiles, error: profileError } = await supabaseAnon
        .from('profiles')
        .select('*')
        .limit(1);

    if (profileError) {
        console.error('❌ Profile Access Failed:', profileError.message);
    } else {
        console.log(`✅ Profile Access OK. Found ${profiles.length} profiles.`);
        if (profiles.length === 0) console.log('   (Table might be empty or RLS hiding rows)');
    }

    // Test 2: Query Tasks
    const { data: tasks, error: taskError } = await supabaseAnon
        .from('tasks')
        .select('*')
        .limit(1);

    if (taskError) {
        console.error('❌ Task Access Failed:', taskError.message);
    } else {
        console.log(`✅ Task Access OK. Found ${tasks.length} tasks.`);
        if (tasks.length === 0) console.log('   (Table might be empty or RLS hiding rows)');
    }
}

testAccess();
