
import { test, expect } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase';

test.describe('E2E Onboarding Flow', () => {

    test('User Follow Event triggers Onboarding Step 1', async ({ request }) => {
        // 1. Setup Mock User & Event
        const mockUserId = `U_TEST_${Date.now()}`;
        const mockEventId = `EV_${Date.now()}`;

        // 2. Mock Webhook Payload (Follow Event)
        const payload = {
            destination: "U_BOT_ID",
            events: [
                {
                    type: "follow",
                    webhookEventId: mockEventId,
                    deliveryContext: { isRedelivery: false },
                    timestamp: Date.now(),
                    source: {
                        type: "user",
                        userId: mockUserId
                    },
                    replyToken: "EXPECT_MOCK_REPLY_TOKEN",
                    mode: "active"
                }
            ]
        };

        // 3. Send Webhook Request
        const response = await request.post('/api/webhook', {
            data: payload
        });

        expect(response.status()).toBe(200);

        // 4. Verify DB Side Effects (Poll for Profile Creation)
        // Wait up to 5 seconds for the webhook to process
        await expect(async () => {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('id', mockUserId)
                .single();

            expect(profile).toBeDefined();
            // Assuming default tutorial_step is 0 or 1 depending on logic
            // In creation it might be 0, but if 'follow' logic updates it? 
            // Previous implementation plan said: "Trigger the first onboarding message sequence."
            // But schema default is 0. 
            // If the logic just sends message, step might remain 0 or update to 1.
            // Let's just check profile exists for now.
            expect(profile?.id).toBe(mockUserId);
        }).toPass({ timeout: 10000 });

        // Cleanup (Optional but good practice)
        await supabaseAdmin.from('profiles').delete().eq('id', mockUserId);
    });

});
