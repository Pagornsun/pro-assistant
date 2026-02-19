/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/route';
import { supabaseAdmin } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(),
    },
}));

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockReturnValue(null),
}));

describe('Tasks API', () => {
    const mockProfile = { id: 'user-123', line_user_id: 'line-123' };
    const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'done' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return 401 if lineUserId is missing', async () => {
            const req = new Request('http://localhost:3000/api/tasks');
            const res = await GET(req as unknown as NextRequest);
            expect(res.status).toBe(401);
        });

        it('should return tasks for valid user', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            range: jest.fn().mockResolvedValue({
                                data: mockTasks, error: null, count: 2
                            })
                        })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks?lineUserId=line-123');
            const res = await GET(req as unknown as NextRequest);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.tasks).toHaveLength(2);
        });

        it('should filter by status', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            range: jest.fn().mockReturnValue({
                                eq: jest.fn().mockResolvedValue({ data: [mockTasks[1]], error: null, count: 1 }),
                                or: jest.fn().mockReturnThis(),
                                then: (resolve: (arg0: { data: { id: string; title: string; status: string; }[]; error: null; count: number; }) => void) => resolve({ data: mockTasks, error: null, count: 2 })
                            })
                        })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks?lineUserId=line-123&status=done');
            const res = await GET(req as unknown as NextRequest);
            expect(res.status).toBe(200);
        });

        it('should filter by search query', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            const searchResMock = jest.fn().mockResolvedValue({ data: [mockTasks[0]], error: null, count: 1 });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            range: jest.fn().mockReturnValue({
                                or: searchResMock,
                            })
                        })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks?lineUserId=line-123&search=Task 1');
            const res = await GET(req as unknown as NextRequest);

            expect(searchResMock).toHaveBeenCalledWith(expect.stringContaining('Task 1'));
            expect(res.status).toBe(200);
        });
    });

    describe('POST', () => {
        it('should create task successfully', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: { ...mockProfile, tier: 'free' }, error: null })
                    })
                })
            });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        gte: jest.fn().mockResolvedValue({ count: 0, error: null })
                    })
                })
            });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                insert: jest.fn().mockReturnValue({
                    select: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockTasks[0], error: null })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks', {
                method: 'POST',
                headers: { 'x-line-user-id': 'line-123' },
                body: JSON.stringify({ title: 'New Task' })
            });

            const res = await POST(req as unknown as NextRequest);
            expect(res.status).toBe(201);
        });
    });
});
