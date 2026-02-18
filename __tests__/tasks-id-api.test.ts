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

// Mock Supabase with a controllable from() implementation
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
    },
}));

import { supabaseAdmin } from '@/lib/supabase';
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
    beforeEach(() => jest.clearAllMocks());

    it('returns 401 without auth header', async () => {
        const res = await GET(makeRequest('GET'), { params });
        expect(res.status).toBe(401);
    });

    it('returns task when authorized', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, title: 'Test Task', user_id: 'profile-1', status: 'pending' },
                    error: null,
                }),
            };
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
    beforeEach(() => jest.clearAllMocks());

    it('returns 401 without auth header', async () => {
        const res = await PATCH(makeRequest('PATCH', { status: 'done' }), { params });
        expect(res.status).toBe(401);
    });

    it('returns 422 for invalid status', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, user_id: 'profile-1', status: 'pending' },
                    error: null,
                }),
            };
        });

        const res = await PATCH(
            makeRequest('PATCH', { status: 'invalid_status' }, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(422);
    });

    it('returns 403 when task belongs to another user', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-OTHER' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, user_id: 'profile-1', status: 'pending' }, // different owner
                    error: null,
                }),
            };
        });

        const res = await PATCH(
            makeRequest('PATCH', { status: 'done' }, { 'x-line-user-id': 'U_other_user' }),
            { params }
        );
        expect(res.status).toBe(403);
        const body = await res.json();
        expect(body.error.code).toBe('FORBIDDEN');
    });

    it('updates task successfully', async () => {
        const updatedTask = { id: TASK_ID, title: 'Updated', user_id: 'profile-1', status: 'done' };

        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            // First call: ownership check (select)
            // Second call: update
            let callCount = 0;
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockImplementation(() => {
                    callCount++;
                    if (callCount === 1) {
                        return Promise.resolve({ data: { id: TASK_ID, user_id: 'profile-1', status: 'pending' }, error: null });
                    }
                    return Promise.resolve({ data: updatedTask, error: null });
                }),
                update: jest.fn().mockReturnThis(),
            };
        });

        const res = await PATCH(
            makeRequest('PATCH', { status: 'done' }, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(200);
    });
});

describe('DELETE /api/tasks/[id]', () => {
    beforeEach(() => jest.clearAllMocks());

    it('returns 401 without auth header', async () => {
        const res = await DELETE(makeRequest('DELETE'), { params });
        expect(res.status).toBe(401);
    });

    it('returns 403 when task belongs to another user', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-OTHER' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, user_id: 'profile-1' },
                    error: null,
                }),
            };
        });

        const res = await DELETE(
            makeRequest('DELETE', undefined, { 'x-line-user-id': 'U_other' }),
            { params }
        );
        expect(res.status).toBe(403);
    });

    it('deletes task and returns success message', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, user_id: 'profile-1' },
                    error: null,
                }),
                delete: jest.fn().mockReturnThis(),
            };
        });

        // Mock the delete chain to resolve
        const mockDelete = jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
        });

        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({
                    data: { id: TASK_ID, user_id: 'profile-1' },
                    error: null,
                }),
                delete: mockDelete,
            };
        });

        const res = await DELETE(
            makeRequest('DELETE', undefined, { 'x-line-user-id': LINE_USER_ID }),
            { params }
        );
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
    });
});
