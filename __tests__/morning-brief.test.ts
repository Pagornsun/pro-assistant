/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/cron/morning-brief/route';
import { supabaseAdmin } from '@/lib/supabase';
import { lineClient } from '@/lib/line';

jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
    },
}));

jest.mock('@/lib/line', () => ({
    lineClient: {
        pushMessage: jest.fn(),
    },
}));

describe('Morning Brief Cron API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.CRON_SECRET = 'test-secret';
        process.env.NEXT_PUBLIC_LIFF_ID = 'test-liff-id';
    });

    it('should return 401 if unauthorized', async () => {
        const req = new Request('http://localhost/api/cron/morning-brief', {
            method: 'POST',
            headers: { Authorization: 'Bearer wrong-secret' },
        });

        // Mock production env
        const originalEnv = process.env.NODE_ENV;
        (process.env as { NODE_ENV: string }).NODE_ENV = 'production';

        const res = await POST(req as unknown as NextRequest);
        expect(res.status).toBe(401);

        (process.env as { NODE_ENV: string }).NODE_ENV = originalEnv;
    });

    it('should send brief to users with pending tasks', async () => {
        const req = new Request('http://localhost/api/cron/morning-brief', {
            method: 'POST',
            headers: { Authorization: 'Bearer test-secret' },
        });

        // Mock profiles
        (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    not: jest.fn().mockResolvedValue({
                        data: [{ id: 'user1', line_user_id: 'line1', display_name: 'User 1' }],
                        error: null,
                    }),
                };
            }
            if (table === 'tasks') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    in: jest.fn().mockReturnThis(),
                    order: jest.fn().mockReturnThis(),
                    limit: jest.fn().mockResolvedValue({
                        data: [
                            { title: 'Task 1' },
                            { title: 'Task 2' },
                            { title: 'Task 3' },
                            { title: 'Task 4' },
                        ],
                        error: null,
                    }),
                };
            }
            return { select: jest.fn() };
        });

        const res = await POST(req as unknown as NextRequest);
        const json = await res.json();

        expect(json.success).toBe(true);
        expect(json.sent).toBe(1);
        expect(lineClient.pushMessage).toHaveBeenCalledWith(
            'line1',
            expect.objectContaining({
                altText: expect.stringContaining('You have 4 tasks pending'),
                contents: expect.objectContaining({
                    body: expect.objectContaining({
                        contents: expect.arrayContaining([
                            expect.objectContaining({ text: expect.stringContaining('Task 1') }),
                            expect.objectContaining({ text: expect.stringContaining('...and more') }),
                        ]),
                    }),
                }),
            })
        );
    });
});
