
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserDashboard from '@/app/dashboard/page';

// Mock useLiff
jest.mock('@/components/providers/LiffProvider', () => ({
    useLiff: () => ({
        profile: {
            userId: 'test-user-id',
            displayName: 'Action Tester',
            pictureUrl: 'https://example.com/pic.jpg'
        },
        isLoggedIn: true,
        error: null
    })
}));

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
    supabase: {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
            data: { id: 'user-123', tier: 'free' },
            error: null
        }),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
            data: [],
            error: null
        })
    }
}));

// Mock Next.js Navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('Dashboard Actions (Rich Menu Integration)', () => {

    beforeEach(() => {
        global.fetch = jest.fn(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ profile: { id: 'test' }, tasks: [] }),
            })
        ) as jest.Mock;
    });

    it('should auto-open "New Task" modal when ?action=new-task query param is present', async () => {
        // Simulate URL with query param
        window.history.pushState({}, 'Test Page', '/dashboard?action=new-task');
        console.log('DEBUG: Test URL:', window.location.search);

        render(<UserDashboard />);

        // The modal should open. Looking for "Select Category" (Modal Title)
        await waitFor(() => {
            const modalTitle = screen.queryByText(/Select Category/i);
            expect(modalTitle).toBeInTheDocument();
        });
    });

    it('should NOT open modal when query param is missing', async () => {
        window.history.pushState({}, 'Test Page', '/dashboard');

        render(<UserDashboard />);

        await waitFor(() => {
            const modalTitle = screen.queryByText(/Select Category/i);
            expect(modalTitle).not.toBeInTheDocument();
        });
    });
});
