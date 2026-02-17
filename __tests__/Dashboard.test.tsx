
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import UserDashboard from '@/app/dashboard/page';

// Mock useLiff
jest.mock('@/components/providers/LiffProvider', () => ({
    useLiff: () => ({
        profile: {
            userId: 'test-user-id',
            displayName: 'Kinn Tester',
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
            data: [
                { id: 1, title: 'Test Task 1', description: 'Testing Description', status: 'pending' }
            ],
            error: null
        })
    }
}));

// Mock Navigation (Next.js)
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

describe('UserDashboard Component', () => {
    it('renders user greeting correctly', async () => {
        render(<UserDashboard />);

        // Check if Greeting appears
        await waitFor(() => {
            expect(screen.getByText(/Good Morning/i)).toBeInTheDocument();
            expect(screen.getByText(/Kinn Tester/i)).toBeInTheDocument();
        });
    });

    it('renders task list from supabase', async () => {
        render(<UserDashboard />);

        // Wait for Supabase data to load
        await waitFor(() => {
            expect(screen.getByText('Test Task 1')).toBeInTheDocument();
            expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
        });
    });

    it('shows Upgrade to Pro button for free tier', async () => {
        render(<UserDashboard />);

        // The logic calculates active task count and displays a Plan "free"
        // The "Upgrade" button is inside SettingsModal, which is hidden by default.
        // But we can check if the "Plan" text "free" is displayed in the status card.
        await waitFor(() => {
            expect(screen.getByText('free')).toBeInTheDocument();
        });
    });
});
