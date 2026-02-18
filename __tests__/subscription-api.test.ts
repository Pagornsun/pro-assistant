
/**
 * @jest-environment node
 */
import { GET, DELETE } from '@/app/api/subscription/route';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
    },
}));

// Mock Stripe
jest.mock('@/lib/stripe', () => ({
    stripe: {
        subscriptions: {
            search: jest.fn(),
            update: jest.fn(),
        },
    },
}));

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockReturnValue(null),
}));

describe('Subscription API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return free plan details', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'user-1', tier: 'free' }, error: null })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.tier).toBe('free');
            expect(body.data.status).toBe('active');
        });

        it('should return pro plan details from Stripe', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'user-1', tier: 'pro' }, error: null })
                    })
                })
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({
                data: [{
                    id: 'sub-1',
                    status: 'active',
                    cancel_at_period_end: false,
                    current_period_end: 1735689600, // 2025-01-01
                }]
            });

            const req = new Request('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.tier).toBe('pro');
            expect(body.data.status).toBe('active');
            expect(body.data.subscription_id).toBe('sub-1');
        });

        it('should handle missing subscription for pro user', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'user-1', tier: 'pro' }, error: null })
                    })
                })
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({ data: [] });

            const req = new Request('http://localhost:3000/api/subscription?lineUserId=line-123');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.status).toBe('unknown');
        });
    });

    describe('DELETE', () => {
        it('should cancel subscription', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { id: 'user-1' }, error: null })
                    })
                })
            });

            (stripe.subscriptions.search as jest.Mock).mockResolvedValue({
                data: [{ id: 'sub-1', status: 'active' }]
            });

            (stripe.subscriptions.update as jest.Mock).mockResolvedValue({
                id: 'sub-1',
                status: 'active',
                cancel_at_period_end: true,
                current_period_end: 1735689600,
            });

            const req = new Request('http://localhost:3000/api/subscription?lineUserId=line-123', {
                method: 'DELETE'
            });
            const res = await DELETE(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.cancel_at_period_end).toBe(true);
            expect(stripe.subscriptions.update).toHaveBeenCalledWith('sub-1', { cancel_at_period_end: true });
        });

        it('should return 401 if lineUserId is missing', async () => {
            const req = new Request('http://localhost:3000/api/subscription', { method: 'DELETE' });
            const res = await DELETE(req as any);
            expect(res.status).toBe(401);
        });
    });
});
