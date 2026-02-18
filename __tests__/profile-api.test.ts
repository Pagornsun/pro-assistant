
/**
 * @jest-environment node
 */
import { GET, PATCH } from '@/app/api/profile/route';
import { supabaseAdmin } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabaseAdmin: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
    },
}));

// Mock rate limit
jest.mock('@/lib/rate-limit', () => ({
    rateLimit: jest.fn().mockReturnValue(null),
}));

describe('Profile API', () => {
    const mockProfile = {
        id: 'user-123',
        line_user_id: 'line-123',
        display_name: 'Test User',
        tier: 'free',
        preferences: { theme: 'light', notifications: true }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET', () => {
        it('should return profile data for valid user', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                    }),
                }),
            });

            const req = new Request('http://localhost:3000/api/profile?lineUserId=line-123');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.success).toBe(true);
            expect(body.data).toEqual(mockProfile);
        });

        it('should return 401 if lineUserId is missing', async () => {
            const req = new Request('http://localhost:3000/api/profile'); // No query param
            const res = await GET(req as any);

            expect(res.status).toBe(401);
        });

        it('should return 404 if profile not found', async () => {
            (supabaseAdmin.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
                    }),
                }),
            });

            const req = new Request('http://localhost:3000/api/profile?lineUserId=unknown');
            const res = await GET(req as any);
            const body = await res.json();

            expect(res.status).toBe(404);
            expect(body.error.message).toBe('ไม่พบข้อมูลผู้ใช้งาน');
        });
    });

    describe('PATCH', () => {
        it('should update preferences successfully', async () => {
            // Mock fetch current profile
            const currentProfileMock = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
                    }),
                }),
            };

            // Mock update
            const updateMock = {
                select: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                        single: jest.fn().mockReturnThis(), // chaining
                    }),
                    single: jest.fn().mockResolvedValue({
                        data: { ...mockProfile, preferences: { theme: 'dark', notifications: true } },
                        error: null
                    }),
                }),
                eq: jest.fn().mockReturnThis(),
                single: jest.fn().mockReturnThis()
            };

            (supabaseAdmin.from as jest.Mock).mockImplementation((table) => {
                if (table === 'profiles') {
                    return {
                        select: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                single: jest.fn().mockResolvedValue({ data: mockProfile, error: null })
                            }))
                        })), // Simplified mock for fetch
                        update: jest.fn(() => ({
                            eq: jest.fn(() => ({
                                select: jest.fn(() => ({
                                    single: jest.fn().mockResolvedValue({
                                        data: { ...mockProfile, preferences: { theme: 'dark', notifications: true } },
                                        error: null
                                    })
                                }))
                            }))
                        }))
                    }
                }
                return {};
            });

            const req = new Request('http://localhost:3000/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    lineUserId: 'line-123',
                    preferences: { theme: 'dark' }
                }),
            });

            const res = await PATCH(req as any);
            const body = await res.json();

            expect(res.status).toBe(200);
            expect(body.data.preferences.theme).toBe('dark');
        });

        it('should return 401 if lineUserId is missing in body', async () => {
            const req = new Request('http://localhost:3000/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    preferences: { theme: 'dark' }
                }),
            });

            const res = await PATCH(req as any);

            expect(res.status).toBe(401);
        });

        it('should return 422 for invalid preferences', async () => {
            const req = new Request('http://localhost:3000/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    lineUserId: 'line-123',
                    preferences: { theme: 'invalid-theme' }
                }),
            });

            const res = await PATCH(req as any);
            const body = await res.json();

            expect(res.status).toBe(422);
            expect(body.error.fields['preferences.theme']).toBeDefined();
        });
    });
});
