
import { test, expect } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase';

test.describe('E2E Bill Splitting Flow', () => {
    test.beforeEach(async () => {
        if (process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            test.skip(true, 'Skipping DB-dependent billing tests in mock mode');
        }
    });

    test('Bill Split Command creates Pending Payment Task with Details', async ({ request }) => {
        // 1. Setup Mock User, Group & Event
        const mockUserId = `U_BILL_TEST_${Date.now()}`;
        const mockGroupId = `G_BILL_TEST_${Date.now()}`;
        const mockEventId = `EV_BILL_${Date.now()}`;
        const totalAmount = 500;
        const peopleCount = 2; // "หาร 2"

        // 2. Mock Webhook Payload (Message Event)
        const payload = {
            destination: "U_BOT_ID",
            events: [
                {
                    type: "message",
                    webhookEventId: mockEventId,
                    deliveryContext: { isRedelivery: false },
                    timestamp: Date.now(),
                    source: {
                        type: "group",
                        userId: mockUserId,
                        groupId: mockGroupId
                    },
                    replyToken: "EXPECT_MOCK_REPLY_TOKEN",
                    mode: "active",
                    message: {
                        type: "text",
                        id: `MSG_${Date.now()}`,
                        text: `ค่าข้าว ${totalAmount} หาร ${peopleCount}` // Text trigger for AI
                    }
                }
            ]
        };

        // 3. Send Webhook Request
        const response = await request.post('/api/webhook', {
            data: payload
        });

        expect(response.status()).toBe(200);

        // 4. Verify DB Side Effects (Poll for Task Creation)
        await expect(async () => {
            // 1. Get Profile
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('line_user_id', mockUserId)
                .maybeSingle();

            if (!profile) {
                console.log(`[E2E Debug] User profile ${mockUserId} not created yet...`);
                throw new Error(`Profile not created yet for ${mockUserId}`);
            }

            // 2. Get ALL tasks for this user
            const { data: tasks, error } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('user_id', profile.id);

            if (error) throw error;

            console.log(`[E2E Debug] DB Check: Found ${tasks?.length || 0} tasks for user ${profile.id} (${mockUserId})`);

            if (tasks && tasks.length > 0) {
                tasks.forEach((t, i) => {
                    console.log(`[E2E Debug] Task[${i}]: Status=${t.status}, Title=${t.title}, GroupID=${t.line_group_id}`);
                });
            }

            // 3. Find matching task
            const task = tasks?.find(t =>
                t.status === 'pending_payment' &&
                (t.line_group_id === mockGroupId || t.title?.includes('Bill:'))
            );

            expect(task).toBeDefined();
            if (!task) throw new Error('Matching pending_payment task not found in user tasks');

            // 4. Check JSONB details
            if (task.bill_split_details) {
                const details = task.bill_split_details as any;
                expect(details.total).toBe(totalAmount);
                expect(details.people_count).toBe(peopleCount);
            } else {
                console.log(`[E2E Debug] Task found but details missing: ${JSON.stringify(task.bill_split_details)}`);
                throw new Error('Task created but bill_split_details missing');
            }

        }).toPass({ timeout: 60000 }); // Max 60s for slow environment

        // Cleanup
        const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('line_user_id', mockUserId).single();
        if (profile) {
            await supabaseAdmin.from('tasks').delete().eq('user_id', profile.id);
            await supabaseAdmin.from('profiles').delete().eq('id', profile.id);
        }
    });

});
