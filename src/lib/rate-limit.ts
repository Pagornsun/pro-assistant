import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────
// Simple in-memory rate limiter
// Uses a sliding window per IP address
// NOTE: For multi-instance deployments, use Vercel KV or Redis instead
// ─────────────────────────────────────────────

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 5 * 60 * 1000);

interface RateLimitConfig {
    windowMs: number;  // Window duration in ms
    max: number;       // Max requests per window
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
    // LINE webhook — generous (LINE retries on failure)
    '/api/webhook': { windowMs: 60_000, max: 100 },
    // Stripe webhook — generous
    '/api/webhook/stripe': { windowMs: 60_000, max: 50 },
    // Checkout — strict (prevent abuse)
    '/api/checkout': { windowMs: 60_000, max: 5 },
    // Task API — moderate
    '/api/tasks': { windowMs: 60_000, max: 60 },
    // Dashboard data — moderate
    '/api/dashboard': { windowMs: 60_000, max: 60 },
    // Default for all other API routes
    default: { windowMs: 60_000, max: 30 },
};

function getConfig(pathname: string): RateLimitConfig {
    for (const [prefix, config] of Object.entries(RATE_LIMITS)) {
        if (prefix !== 'default' && pathname.startsWith(prefix)) {
            return config;
        }
    }
    return RATE_LIMITS.default;
}

function getClientIp(request: NextRequest): string {
    return (
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
    );
}

export function rateLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIp(request);
    const pathname = request.nextUrl.pathname;
    const config = getConfig(pathname);
    const key = `${ip}:${pathname}`;
    const now = Date.now();

    let entry = store.get(key);

    if (!entry || entry.resetAt < now) {
        entry = { count: 1, resetAt: now + config.windowMs };
        store.set(key, entry);
        return null; // Allow
    }

    entry.count++;

    if (entry.count > config.max) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        return NextResponse.json(
            { success: false, error: { code: 'RATE_LIMIT', message: 'คำขอมากเกินไป กรุณารอสักครู่' } },
            {
                status: 429,
                headers: {
                    'Retry-After': String(retryAfter),
                    'X-RateLimit-Limit': String(config.max),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
                },
            }
        );
    }

    return null; // Allow
}
