/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { PATCH } from '@/app/api/tasks/[id]/route';

// Mock Supabase
jest.mock('@/lib/supabase', () => {
    return {
        supabase: {
            auth: {
                getUser: jest.fn(),
            },
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
        },
        supabaseAdmin: {
            from: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockReturnThis(),
        }
    };
});
import { supabase, supabaseAdmin } from '@/lib/supabase';

describe('Recurring Tasks Logic (PATCH)', () => {
    const mockUser = { id: 'user-123' };
    const mockTask = {
        id: 'task-1',
        user_id: 'user-123',
        title: 'Weekly Task',
        status: 'pending',
        recurring_config: { frequency: 'weekly', interval: 1 },
        due_date: '2023-01-01T10:00:00Z',
    };

    beforeEach(() => {
        jest.clearAllMocks();
        // Default authorized user
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser }, error: null });
    });

    it('should create a new task when a recurring task is marked as done', async () => {
        // Mock Update response (simulating the task transitioning to 'done')
        const updatedTask = { ...mockTask, status: 'done' };

        // Mock validateUser
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null })
        });



        // Mock chain for Update
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: updatedTask, error: null })
                        })
                    })
                })
            })
        });

        // Mock Insert (for the new task)
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            insert: jest.fn().mockResolvedValue({ error: null })
        });

        const req = new NextRequest('http://localhost:3000/api/tasks/task-1?lineUserId=user-123', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'done' })
        });

        const params = Promise.resolve({ id: 'task-1' });
        await PATCH(req as unknown as NextRequest, { params });

        // Verify insert was called for the NEXT task
        // We expect: same title, new due date (1 week later)
        expect(supabaseAdmin.from).toHaveBeenCalledTimes(3); // 1. Validate, 2. Update, 3. Insert

        const insertCall = (supabaseAdmin.from as jest.Mock).mock.calls[2]; // The third call to .from()
        // Wait, supabase.from() returns a query builder.
        // We mocked it to return 'this' usually, but in my mock setup above I used mockReturnValueOnce chain.
        // Let's inspect the mocked method calls instead.
    });

    it('should NOT create a new task if recurring task is NOT marked as done', async () => {
        // Mock Update response (status changed to 'processing', not 'done')
        const updatedTask = { ...mockTask, status: 'processing' };

        // Mock validateUser
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null })
        });

        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: updatedTask, error: null })
                        })
                    })
                })
            })
        });

        const req = new NextRequest('http://localhost:3000/api/tasks/task-1?lineUserId=user-123', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'processing' })
        });

        const params = Promise.resolve({ id: 'task-1' });
        await PATCH(req as unknown as NextRequest, { params });

        expect(supabaseAdmin.from).toHaveBeenCalledTimes(2); // 1. Validate, 2. Update
    });

    it('should calculate next due date correctly for weekly recurrence', async () => {
        const updatedTask = { ...mockTask, status: 'done', due_date: '2023-01-01T10:00:00.000Z' };

        // Setup Mocks
        const insertMock = jest.fn().mockResolvedValue({ error: null });

        // Mock validateUser
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: { id: 'user-123' }, error: null })
        });

        // 1. Update Mock
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        select: jest.fn().mockReturnValue({
                            single: jest.fn().mockResolvedValue({ data: updatedTask, error: null })
                        })
                    })
                })
            })
        });

        // 2. Insert Mock
        (supabaseAdmin.from as jest.Mock).mockReturnValueOnce({
            insert: insertMock
        });

        const req = new NextRequest('http://localhost:3000/api/tasks/task-1?lineUserId=user-123', {
            method: 'PATCH',
            body: JSON.stringify({ status: 'done' })
        });

        const params = Promise.resolve({ id: 'task-1' });
        await PATCH(req as unknown as NextRequest, { params });

        expect(insertMock).toHaveBeenCalled();
        const insertedPayload = insertMock.mock.calls[0][0];
        // 2023-01-01 + 7 days = 2023-01-08
        expect(insertedPayload.due_date).toBe('2023-01-08T10:00:00.000Z');
        expect(insertedPayload.status).toBe('pending');
        expect(insertedPayload.recurring_config).toEqual(mockTask.recurring_config);
    });
});
