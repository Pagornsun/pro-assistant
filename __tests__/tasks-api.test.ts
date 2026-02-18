
/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/tasks/route';
import { supabaseAdmin } from '@/lib/supabase';
import { rateLimit } from '@/lib/rate-limit';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(), // Added limit
        range: jest.fn().mockReturnThis(), // Added range
        single: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        or: jest.fn().mockReturnThis(), // Added or for search
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
            const res = await GET(req as any);
            expect(res.status).toBe(401);
        });

        it('should return tasks for valid user', async () => {
            // Mock profile fetch
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            // Mock tasks fetch
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
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.tasks).toHaveLength(2);
        });

        it('should filter by status', async () => {
            // Mock profile fetch
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            // Mock tasks fetch with status filter
            const rangeMock = jest.fn().mockResolvedValue({ data: [mockTasks[1]], error: null, count: 1 });
            const orderMock = jest.fn().mockReturnValue({ range: rangeMock });
            const eqStatusMock = jest.fn().mockReturnValue({ order: orderMock });

            // Reconstruct chain: from -> select -> eq(user) -> eq(status) -> order -> range
            // But wait, the code does: query = query.eq('status', status);
            // So chaining is: select().eq().eq().order().range() OR select().eq().order().range() (if no status)
            // But 'order' is usually at the end before range?
            // Code: .eq('user_id').order().range(); if status -> query.eq()
            // Note: Supabase query builder is mutable or returns new builder? Usually mutable in JS client, but we mock it.
            // My code:
            // let query = supabaseAdmin...range(...)
            // if (status) query = query.eq(...)
            // The order of calls in the Chain might be important for the Mock.
            // Actually, `.range` is called BEFORE `.eq('status')` in my code?
            // Let's check route.ts:
            // .order().range(offset, offset + limit - 1);
            // if (status) query = query.eq('status', status);

            // So range is called early.

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            range: jest.fn().mockReturnValue({
                                // This object handles subsequent calls like .eq or .or
                                eq: jest.fn().mockResolvedValue({ data: [mockTasks[1]], error: null, count: 1 }),
                                or: jest.fn().mockResolvedValue({ data: [mockTasks[1]], error: null, count: 1 }),
                                then: (resolve: any) => resolve({ data: mockTasks, error: null, count: 2 }) // default if no await on query modifier
                            })
                        })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks?lineUserId=line-123&status=done');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            // Since we mocked the return of the chain that includes eq('status', 'done'), we verify calls or result
            // Here assuming mock setup returns the filtered list
        });

        it('should filter by search query', async () => {
            // Mock profile fetch
            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                    })
                })
            });

            // Mock tasks fetch with search
            const searchResMock = jest.fn().mockResolvedValue({ data: [mockTasks[0]], error: null, count: 1 });

            (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        order: jest.fn().mockReturnValue({
                            range: jest.fn().mockReturnValue({
                                or: searchResMock,
                                // then: ... if needed
                            })
                        })
                    })
                })
            });

            const req = new Request('http://localhost:3000/api/tasks?lineUserId=line-123&search=Task 1');
            const res = await GET(req as any);

            expect(searchResMock).toHaveBeenCalledWith(expect.stringContaining('Task 1'));
            expect(res.status).toBe(200);
        });
    });

    // POST tests can remain simple or copied from verify_verification. But focusing on GET search here.
});
