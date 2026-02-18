/**
 * @jest-environment node
 *
 * Integration tests for /api/tasks route (GET + POST)
 * Tests: auth, validation, DB interaction (mocked Supabase)
 */

import { NextRequest } from 'next/server';

// Mock Supabase admin client
const mockSingle = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockRange = jest.fn();
const mockOr = jest.fn();

const buildChain = () => ({
    select: mockSelect.mockReturnThis(),
    eq: mockEq.mockReturnThis(),
    order: mockOrder.mockReturnThis(),
    range: mockRange.mockReturnThis(),
    or: mockOr.mockReturnThis(),
    single: mockSingle,
    insert: mockInsert,
});

jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(() => buildChain()),
    },
}));

// Mock rate limiter to always allow
jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn(() => null),
}));

import { supabaseAdmin } from '@/lib/supabase';
import { GET, POST } from '../src/app/api/tasks/route';

function makeGetRequest(params: Record<string, string> = {}, headers: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/tasks');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new NextRequest(url.toString(), { headers });
}

function makePostRequest(body: unknown, headers: Record<string, string> = {}): NextRequest {
    return new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
}

describe('GET /api/tasks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when lineUserId is missing', async () => {
        const res = await GET(makeGetRequest());
        expect(res.status).toBe(401);
        const body = await res.json();
        expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 404 when profile not found', async () => {
        (supabaseAdmin.from as jest.Mock).mockReturnValue({
            ...buildChain(),
            single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        });

        const res = await GET(makeGetRequest({ lineUserId: 'U_unknown' }));
        expect(res.status).toBe(404);
        const body = await res.json();
        expect(body.error.code).toBe('NOT_FOUND');
    });

    it('returns tasks list when profile exists', async () => {
        const mockTasks = [
            { id: 'task-1', title: 'Buy milk', status: 'pending', user_id: 'profile-1' },
        ];

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
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({ data: mockTasks, error: null, count: 1 }),
                or: jest.fn().mockReturnThis(),
            };
        });

        const res = await GET(makeGetRequest({ lineUserId: 'U_valid' }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.tasks).toHaveLength(1);
        expect(body.data.tasks[0].title).toBe('Buy milk');
    });

    it('returns empty tasks array for new user', async () => {
        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-new' }, error: null }),
                };
            }
            return {
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockReturnThis(),
                range: jest.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
                or: jest.fn().mockReturnThis(),
            };
        });

        const res = await GET(makeGetRequest({ lineUserId: 'U_new_user' }));
        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.data.tasks).toHaveLength(0);
        expect(body.data.total).toBe(0);
    });
});

describe('POST /api/tasks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 when x-line-user-id header is missing', async () => {
        const res = await POST(makePostRequest({ title: 'Test task' }));
        expect(res.status).toBe(401);
    });

    it('returns 422 when title is empty', async () => {
        const res = await POST(
            makePostRequest({ title: '' }, { 'x-line-user-id': 'U_valid' })
        );
        expect(res.status).toBe(422);
        const body = await res.json();
        expect(body.error.code).toBe('VALIDATION_ERROR');
        expect(body.error.fields.title).toBeDefined();
    });

    it('returns 422 when title is missing', async () => {
        const res = await POST(
            makePostRequest({}, { 'x-line-user-id': 'U_valid' })
        );
        expect(res.status).toBe(422);
    });

    it('creates task and returns 201', async () => {
        const newTask = {
            id: 'new-task-id',
            title: 'Buy groceries',
            status: 'pending',
            user_id: 'profile-1',
        };

        (supabaseAdmin.from as jest.Mock).mockImplementation((table: string) => {
            if (table === 'profiles') {
                return {
                    select: jest.fn().mockReturnThis(),
                    eq: jest.fn().mockReturnThis(),
                    single: jest.fn().mockResolvedValue({ data: { id: 'profile-1' }, error: null }),
                };
            }
            return {
                insert: jest.fn().mockReturnThis(),
                select: jest.fn().mockReturnThis(),
                single: jest.fn().mockResolvedValue({ data: newTask, error: null }),
            };
        });

        const res = await POST(
            makePostRequest(
                { title: 'Buy groceries', description: 'Milk, eggs, bread' },
                { 'x-line-user-id': 'U_valid' }
            )
        );
        expect(res.status).toBe(201);
        const body = await res.json();
        expect(body.success).toBe(true);
        expect(body.data.title).toBe('Buy groceries');
    });

    it('returns 422 when title exceeds 200 characters', async () => {
        const res = await POST(
            makePostRequest(
                { title: 'x'.repeat(201) },
                { 'x-line-user-id': 'U_valid' }
            )
        );
        expect(res.status).toBe(422);
    });
});
