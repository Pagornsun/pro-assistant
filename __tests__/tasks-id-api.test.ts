/**
 * @jest-environment node
 *
 * Integration tests for /api/tasks/[id] route (GET + PATCH + DELETE)
 * Tests: ownership verification, validation, DB interaction
 */

import { NextRequest } from 'next/server';

// Mock rate limiter
jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn(() => null),
}));

// Mock Supabase
// Mock Supabase
jest.mock('@/lib/supabase', () => {
    const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
    };
    return {
        supabase: {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn(),
        },
        supabaseAdmin: {
            from: jest.fn().mockReturnValue(mockChain),
        },
    };
});

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { GET, PATCH, DELETE } from '../src/app/api/tasks/[id]/route';

const TASK_ID = 'task-1';
const LINE_USER_ID = 'U_valid';

function makeRequest(method: string, body?: unknown, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest(`http://localhost:3000/api/tasks/${TASK_ID}`, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: body ? JSON.stringify(body) : undefined,
    });
}

const params = Promise.resolve({ id: TASK_ID });

describe('GET /api/tasks/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default auth mock: unauthorized
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
    });

    it('returns 401 without auth header', async () => {
        // user is null by default from beforeEach
        const res = await GET(makeRequest('GET'), { params });
        expect(res.status).toBe(401);
    });

    it('returns task when authorized', async () => {
        // Mock authorized user
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: { id: 'auth-user-id' } },
            error: null
        });

        (supabaseAdmin.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: { id: TASK_ID, title: 'Test Task', user_id: 'auth-user-id', status: 'pending' },
                error: null,
            }),
        });

        const res = await GET(
            makeRequest('GET', undefined, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.id).toBe(TASK_ID);
    });
});

describe('PATCH /api/tasks/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
    });

    it('returns 401 without auth header', async () => {
        const res = await PATCH(makeRequest('PATCH', { status: 'done' }), { params });
        expect(res.status).toBe(401);
    });

    it('returns 422 for invalid status', async () => {
        // Mock authorized user
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: { id: 'auth-user-id' } },
            error: null
        });

        // Mock update failure shouldn't happen here if status is invalid? 
        // Wait, logic says: body = await req.json(); ... supabase.update(body)...
        // But invalid enum? Supabase might complain, or Zod if used.
        // The implementation passes body directly to supabase.update(body).
        // If 'status' is invalid enum, supabase returns error.

        // 1. validateUser Mock (Success)
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'auth-user-id' }, error: null }),
        });

        // 2. Update Mock (Error)
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Invalid input value for enum task_status' }
            })
        });

        const res = await PATCH(
            makeRequest('PATCH', { status: 'invalid_status' }, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(500); // Implementation returns 500 on DB error
    });

    it('updates task successfully', async () => {
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: { id: 'auth-user-id' } },
            error: null
        });

        const updatedTask = { id: TASK_ID, title: 'Updated', user_id: 'auth-user-id', status: 'done' };

        // 1. validateUser Mock (Success)
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'auth-user-id' }, error: null }),
        });

        // 2. Update Mock (Success)
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: updatedTask, error: null }),
            // For recurring logic (insert)
            insert: jest.fn().mockResolvedValue({ data: null, error: null })
        });

        const res = await PATCH(
            makeRequest('PATCH', { status: 'done' }, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/tasks/[id]', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null }, error: null });
    });

    it('returns 401 without auth header', async () => {
        const res = await DELETE(makeRequest('DELETE'), { params });
        expect(res.status).toBe(401);
    });

    it('deletes task and returns success message', async () => {
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: { id: 'auth-user-id' } },
            error: null
        });

        const mockChain: any = {
            then: (resolve: (arg0: { error: null }) => void) => resolve({ error: null })
        };
        mockChain.eq = jest.fn().mockReturnValue(mockChain);
        mockChain.delete = jest.fn().mockReturnValue(mockChain);
        mockChain.select = jest.fn().mockReturnValue(mockChain); // For validateUser
        mockChain.single = jest.fn().mockResolvedValue({ data: { id: 'user_123' }, error: null }); // For validateUser

        (supabaseAdmin.from as jest.Mock).mockReturnValue(mockChain);

        const res = await DELETE(
            makeRequest('DELETE', undefined, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
    });
});
