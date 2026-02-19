
import { test, expect } from '@playwright/test';
import { supabaseAdmin } from '../src/lib/supabase';

test.describe('E2E Onboarding Flow', () => {
    test.beforeEach(async () => {
        if (process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            test.skip(true, 'Skipping DB-dependent onboarding tests in mock mode');
        }
    });

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

        await expect(async () => {
            const { data: profile } = await supabaseAdmin
                .from('profiles')
                .select('*')
                .eq('line_user_id', mockUserId)
                .single();

            expect(profile).toBeDefined();
            expect(profile?.line_user_id).toBe(mockUserId);
        }).toPass({ timeout: 15000 });

        // Cleanup (Optional but good practice)
        await supabaseAdmin.from('profiles').delete().eq('line_user_id', mockUserId);
    });

});
