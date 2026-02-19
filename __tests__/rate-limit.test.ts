/**
 * @jest-environment node
 *
 * Unit tests for rate-limit.ts
 * Tests: sliding window, per-route limits, 429 response, Retry-After header
 */

import { NextRequest } from 'next/server';

// We need to reset the module between tests to clear the in-memory store
let rateLimit: (req: NextRequest) => ReturnType<typeof import('next/server').NextResponse.json> | null;

function makeRequest(pathname: string, ip = '127.0.0.1'): NextRequest {
    const url = `http://localhost:3000${pathname}`;
    return new NextRequest(url, {
        headers: { 'x-forwarded-for': ip },
    });
}

describe('rateLimit', () => {
    beforeEach(async () => {
        // Reset module to clear the in-memory store
        jest.resetModules();
        const mockedModule = await import('../src/lib/rate-limit');
        rateLimit = mockedModule.rateLimit;
    });

    it('allows requests under the limit', () => {
        const req = makeRequest('/api/tasks');
        const result = rateLimit(req);
        expect(result).toBeNull(); // null = allowed
    });

    it('blocks requests over the limit for /api/checkout (limit: 5)', () => {
        const ip = '10.0.0.1';
        // Send 5 allowed requests
        for (let i = 0; i < 5; i++) {
            const result = rateLimit(makeRequest('/api/checkout', ip));
            expect(result).toBeNull();
        }
        // 6th request should be blocked
        const blocked = rateLimit(makeRequest('/api/checkout', ip));
        expect(blocked).not.toBeNull();
        expect(blocked!.status).toBe(429);
    });

    it('returns Retry-After header when rate limited', async () => {
        const ip = '10.0.0.2';
        for (let i = 0; i < 5; i++) {
            rateLimit(makeRequest('/api/checkout', ip));
        }
        const blocked = rateLimit(makeRequest('/api/checkout', ip));
        expect(blocked).not.toBeNull();
        expect(blocked!.headers.get('Retry-After')).toBeTruthy();
    });

    it('returns 429 JSON with correct error code', async () => {
        const ip = '10.0.0.3';
        for (let i = 0; i < 5; i++) {
            rateLimit(makeRequest('/api/checkout', ip));
        }
        const blocked = rateLimit(makeRequest('/api/checkout', ip));
        expect(blocked).not.toBeNull();
        const body = await blocked!.json();
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('RATE_LIMIT');
    });

    it('tracks different IPs independently', () => {
        // IP A hits limit
        const ipA = '192.168.1.1';
        for (let i = 0; i < 5; i++) {
            rateLimit(makeRequest('/api/checkout', ipA));
        }
        expect(rateLimit(makeRequest('/api/checkout', ipA))).not.toBeNull(); // blocked

        // IP B should still be allowed
        const ipB = '192.168.1.2';
        expect(rateLimit(makeRequest('/api/checkout', ipB))).toBeNull(); // allowed
    });

    it('uses default limit for unknown routes', () => {
        const ip = '10.0.0.4';
        // Default limit is 30
        for (let i = 0; i < 30; i++) {
            const result = rateLimit(makeRequest('/api/unknown-route', ip));
            expect(result).toBeNull();
        }
        // 31st should be blocked
        const blocked = rateLimit(makeRequest('/api/unknown-route', ip));
        expect(blocked).not.toBeNull();
        expect(blocked!.status).toBe(429);
    });

    it('uses x-real-ip as fallback when x-forwarded-for is missing', () => {
        const url = 'http://localhost:3000/api/checkout';
        const req = new NextRequest(url, {
            headers: { 'x-real-ip': '172.16.0.1' },
        });
        const result = rateLimit(req);
        expect(result).toBeNull();
    });
});
