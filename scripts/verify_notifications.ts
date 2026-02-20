
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
    console.log('🧪 Starting Notification Center Verification...');

    // 1. Create a mock user
    const mockEmail = `mock-user-${Date.now()}@test.com`;
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
        email: mockEmail,
        email_confirm: true,
        user_metadata: { line_user_id: 'mock-line-notif-' + Date.now() }
    });

    if (userError || !user.user) {
        throw new Error('User Creation Failed: ' + userError?.message);
    }

    const mockUserId = user.user.id;
    console.log('✅ Created User:', mockUserId);

    // Create Profile (if not created by trigger)
    await supabase.from('profiles').upsert({ id: mockUserId, line_user_id: user.user.user_metadata.line_user_id });

    // 2. Create Notification
    console.log('📝 Creating Notification...');
    const { data: notif, error: createError } = await supabase
        .from('notifications')
        .insert({
            user_id: mockUserId,
            title: 'Test Notification',
            message: 'This is a test.',
            type: 'info'
        })
        .select()
        .single();

    if (createError) {
        console.error('❌ Create Notification Error:', createError.message);
    } else {
        console.log('✅ Notification Created:', notif.id);
    }

    // 3. Mark as Read
    console.log('📝 Marking as Read...');
    const { error: updateError } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notif?.id);

    if (updateError) {
        console.error('❌ Update Error:', updateError.message);
    } else {
        console.log('✅ Notification Marked as Read');
    }

    // 4. Delete
    console.log('📝 Deleting Notification...');
    const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notif?.id);

    if (deleteError) {
        console.error('❌ Delete Error:', deleteError.message);
    } else {
        console.log('✅ Notification Deleted');
    }

    // Cleanup Profile & User
    await supabase.from('profiles').delete().eq('id', mockUserId);
    await supabase.auth.admin.deleteUser(mockUserId);
    console.log('✨ Cleanup complete.');
}

runTests().catch(console.error);
