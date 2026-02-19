
/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const MOCK_LINE_USER_ID = 'mock-user-id';
const MOCK_EMAIL = 'mock-e2e-user@example.com';

async function seed() {
    // 1. Create or get Auth User
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    let user = users.find(u => u.email === MOCK_EMAIL);

    if (!user) {
        const { data: { user: newUser }, error: createError } = await supabase.auth.admin.createUser({
            email: MOCK_EMAIL,
            email_confirm: true,
            user_metadata: { displayName: 'Mock E2E User' }
        });
        if (createError) {
            console.error('Create User Error:', createError);
            process.exit(1);
        }
        user = newUser;
    }

    // 2. Upsert Profile
    const { data, error } = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            line_user_id: MOCK_LINE_USER_ID,
            tier: 'pro',
            preferences: { displayName: 'Mock E2E User' }
        }, { onConflict: 'line_user_id' });

    if (error) {
        console.error('Seed Error:', error);
        process.exit(1);
    } else {
        console.log('Mock user seeded successfully.');
    }
}

seed();
