/**
 * @jest-environment node
 */
import { DELETE } from '@/app/api/account/route';
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Mock dependencies
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn(),
        auth: {
            admin: {
                deleteUser: jest.fn(),
            }
        }
    }
}));

jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockReturnValue(null),
}));

describe('DELETE /api/account', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 401 if x-line-user-id header is missing', async () => {
        const req = new Request('http://localhost:3000/api/account', {
            method: 'DELETE',
        });

        const res = await DELETE(req as unknown as NextRequest);
        const json = await res.json();

        expect(res.status).toBe(401);
        expect(json.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 404 if user profile not found', async () => {
        const req = new Request('http://localhost:3000/api/account', {
            method: 'DELETE',
            headers: { 'x-line-user-id': 'U123456' },
        });

        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: null, error: null })
                })
            })
        });
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        const res = await DELETE(req as unknown as NextRequest);
        expect(res.status).toBe(404);
    });

    it('should delete user successfully', async () => {
        const req = new Request('http://localhost:3000/api/account', {
            method: 'DELETE',
            headers: { 'x-line-user-id': 'U123456' },
        });

        // Mock Profile Found
        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'user_123' },
                        error: null
                    })
                })
            })
        });
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        // Mock Delete Success
        (supabaseAdmin.auth.admin.deleteUser as any).mockResolvedValue({
            data: {}, error: null
        });

        const res = await DELETE(req as unknown as NextRequest);
        const json = await res.json();

        expect(res.status).toBe(200);
        expect(json.data.message).toContain('deleted successfully');
        expect(supabaseAdmin.auth.admin.deleteUser).toHaveBeenCalledWith('user_123');
    });

    it('should handle delete error', async () => {
        const req = new Request('http://localhost:3000/api/account', {
            method: 'DELETE',
            headers: { 'x-line-user-id': 'U123456' },
        });

        // Mock Profile Found
        const mockFrom = jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                        data: { id: 'user_123' },
                        error: null
                    })
                })
            })
        });
        (supabaseAdmin.from as any).mockImplementation(mockFrom);

        // Mock Delete Error
        (supabaseAdmin.auth.admin.deleteUser as any).mockResolvedValue({
            data: null, error: { message: 'Supabase error' }
        });

        const res = await DELETE(req as unknown as NextRequest);
        expect(res.status).toBe(500);
    });
});
