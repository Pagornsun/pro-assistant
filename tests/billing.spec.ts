
import { test, expect } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase';

test.describe('E2E Bill Splitting Flow', () => {

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
            const { data: task } = await supabaseAdmin
                .from('tasks')
                .select('*')
                .eq('user_id', mockUserId)
                .eq('line_group_id', mockGroupId)
                .eq('status', 'pending_payment')
                .maybeSingle(); // Use maybeSingle to avoid error if not found immediately

            expect(task).toBeDefined();
            expect(task?.status).toBe('pending_payment');

            // Check JSONB details
            // Supabase returns JSONB as object
            if (task && task.bill_split_details) {
                const details = task.bill_split_details as any;
                expect(details.total).toBe(totalAmount);
                expect(details.people_count).toBe(peopleCount);
            } else {
                // If AI failed or logic failed, this will fail
                throw new Error('Task created but bill_split_details missing or task not found');
            }

        }).toPass({ timeout: 15000 }); // Give AI some time (Gemini might be slow)

        // Cleanup
        await supabaseAdmin.from('tasks').delete().eq('user_id', mockUserId);
        await supabaseAdmin.from('profiles').delete().eq('id', mockUserId);
    });

});
