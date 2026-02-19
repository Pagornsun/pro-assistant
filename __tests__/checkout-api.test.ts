/**
 * @jest-environment node
 */
import { POST } from '@/app/api/checkout/route';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { stripe } from '@/lib/stripe';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
        auth: {
            admin: {
                getUserById: jest.fn(),
            }
        }
    }
}));

jest.mock('@/lib/stripe', () => ({
    stripe: {
        checkout: {
            sessions: {
                create: jest.fn(),
            }
        }
    }
}));

jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockReturnValue(null),
}));

describe('POST /api/checkout', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.STRIPE_PRICE_ID_PRO = 'price_test_123';
    });

    it('should return 401 if x-line-user-id header is missing', async () => {
        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            body: JSON.stringify({}),
        });

        const res = await POST(req as unknown as NextRequest);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 if user profile not found', async () => {
        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'x-line-user-id': 'U123456' },
            body: JSON.stringify({}),
        });

        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
            })
        });
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        const res = await POST(req as unknown as NextRequest);
        expect(res.status).toBe(401);
    });

    it('should create a checkout session for valid user', async () => {
        const req = new Request('http://localhost:3000/api/checkout', {
            method: 'POST',
            headers: { 'x-line-user-id': 'U123456' },
            body: JSON.stringify({}),
        });

        // Mock Profile Found
        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'user_123', email: 'test@example.com' },
                        error: null
                    })
                })
            })
        });
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        // Mock Stripe Session Creation
        (stripe.checkout.sessions.create as any).mockResolvedValue({
            url: 'https://checkout.stripe.com/test'
        });

        const res = await POST(req as unknown as NextRequest);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.url).toBe('https://checkout.stripe.com/test');
        expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(expect.objectContaining({
            client_reference_id: 'user_123',
            metadata: {
                userId: 'user_123',
                lineUserId: 'U123456'
            }
        }));
    });
});
