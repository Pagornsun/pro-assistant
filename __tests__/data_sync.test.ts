
/**
 * @jest-environment node
 */
import { supabaseAdmin } from '@/lib/supabase';

// We use the 'node' environment to allow direct DB access via supabaseAdmin
// This test verifies that data written by the "Bot" (Admin) is readable.

describe('System Integration: Data Sync', () => {

    // Helper to generic a random ID
    const testLineUserId = `test-user-${Date.now()}`;
    let userId: string;

    beforeAll(async () => {
        // 1. Simulate: Create Auth User (Required for Profile FK)
        const email = `${testLineUserId}@test.kinn.com`;
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            email_confirm: true,
            user_metadata: { line_user_id: testLineUserId }
        });

        if (authError) throw new Error(`Auth Setup Failed: ${authError.message}`);
        userId = authData.user.id;

        // 2. Simulate: Create Profile (Bot logic)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .insert({
                id: userId,
                line_user_id: testLineUserId,
                tier: 'free'
            }); // No display_name in schema apparently

        if (profileError) throw new Error(`Profile Setup Failed: ${profileError.message}`);
    });

    afterAll(async () => {
        // Cleanup
        if (userId) {
            await supabaseAdmin.from('tasks').delete().eq('user_id', userId);
            await supabaseAdmin.from('profiles').delete().eq('id', userId);
            await supabaseAdmin.auth.admin.deleteUser(userId);
        }
    });

    it('should sync "Chat Task" to "Dashboard Database"', async () => {
        // 1. Simulate: Bot Creates a Task (via Chat logic)
        const taskTitle = 'Test Sync Task';
        const { error: insertError } = await supabaseAdmin
            .from('tasks')
            .insert({
                user_id: userId,
                title: taskTitle,
                status: 'pending'
            });

        expect(insertError).toBeNull();

        // 2. Simulate: Dashboard Fetches Task
        const { data: fetchedTasks, error: fetchError } = await supabaseAdmin
            .from('tasks')
            .select('*')
            .eq('user_id', userId);

        expect(fetchError).toBeNull();
        expect(fetchedTasks).toHaveLength(1);
        expect(fetchedTasks![0].title).toBe(taskTitle);

        console.log(`✅ Verified: Task "${fetchedTasks![0].title}" exists in DB.`);
    });
});
