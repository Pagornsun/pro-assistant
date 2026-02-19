/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, DELETE } from '@/app/api/subscription/route';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
    },
}));

jest.mock('@/lib/stripe', () => ({
    stripe: {
        subscriptions: {
            search: jest.fn(),
            update: jest.fn(),
        },
    },
}));

describe('Subscription API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return subscription details for active pro user', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_123' }, error: null }),
                    }),
                }),
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({
                data: [
                    {
                        id: 'sub_123',
                        status: 'active',
                        current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
                        items: { data: [{ plan: { interval: 'month' } }] }
                    }
                ]
            });

            const req = new NextRequest('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data.status).toBe('active');
        });

        it('should return no subscription for free user', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { stripe_customer_id: null, tier: 'free' }, error: null }),
                    }),
                }),
            });

            const req = new NextRequest('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.tier).toBe('free');
            expect(body.data.status).toBe('active');
        });

        it('should handle stripe search with no results', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { stripe_customer_id: 'cus_empty' }, error: null }),
                    }),
                }),
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({ data: [] });

            const req = new NextRequest('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.status).toBe('unknown');
        });
    });

    describe('DELETE', () => {
        it('should cancel subscription successfully', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'user-123', stripe_customer_id: 'cus_123' }, error: null }),
                    }),
                }),
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({
                data: [{ id: 'sub_123' }]
            });

            (stripe.subscriptions.update as jest.Mock).mockResolvedValue({
                id: 'sub_123',
                status: 'active',
                cancel_at_period_end: true,
                current_period_end: 1234567890
            });

            const req = new NextRequest('http://localhost:3000/api/subscription?lineUserId=line-123', {
                method: 'DELETE'
            });
            const res = await DELETE(req);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: true });
        });

        it('should return 401 if lineUserId is missing', async () => {
            const req = new NextRequest('http://localhost:3000/api/subscription', { method: 'DELETE' });
            const res = await DELETE(req);
            expect(res.status).toBe(401);
        });
    });
});
