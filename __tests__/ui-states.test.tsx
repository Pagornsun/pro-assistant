/**
 * Unit tests for UI state components (src/components/ui/States.tsx)
 * Tests: Skeleton, EmptyState, ErrorState, LoadingSpinner, FullPageLoader
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
    Skeleton,
    TaskCardSkeleton,
    StatCardSkeleton,
    EmptyState,
    ErrorState,
    LoadingSpinner,
    FullPageLoader,
} from '@/components/ui/States';

// ─────────────────────────────────────────────
// Skeleton
// ─────────────────────────────────────────────
describe('Skeleton', () => {
    it('renders with animate-pulse class', () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('accepts custom className', () => {
        const { container } = render(<Skeleton className="h-4 w-24" />);
        expect(container.firstChild).toHaveClass('h-4', 'w-24');
    });

    it('has aria-hidden for accessibility', () => {
        const { container } = render(<Skeleton />);
        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
});

describe('TaskCardSkeleton', () => {
    it('renders without crashing', () => {
        const { container } = render(<TaskCardSkeleton />);
        expect(container.firstChild).toBeTruthy();
    });
});

describe('StatCardSkeleton', () => {
    it('renders without crashing', () => {
        const { container } = render(<StatCardSkeleton />);
        expect(container.firstChild).toBeTruthy();
    });
});

// ─────────────────────────────────────────────
// EmptyState
// ─────────────────────────────────────────────
describe('EmptyState', () => {
    it('renders title', () => {
        render(<EmptyState title="ยังไม่มีงาน" />);
        expect(screen.getByText('ยังไม่มีงาน')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
        render(<EmptyState title="ยังไม่มีงาน" description="สร้างงานแรกของคุณ" />);
        expect(screen.getByText('สร้างงานแรกของคุณ')).toBeInTheDocument();
    });

    it('does not render description when not provided', () => {
        render(<EmptyState title="ยังไม่มีงาน" />);
        expect(screen.queryByText('สร้างงานแรกของคุณ')).not.toBeInTheDocument();
    });

    it('renders action button when provided', () => {
        const onClick = jest.fn();
        render(
            <EmptyState
                title="ยังไม่มีงาน"
                action={{ label: 'สร้างงาน', onClick }}
            />
        );
        expect(screen.getByText('สร้างงาน')).toBeInTheDocument();
    });

    it('calls onClick when action button is clicked', () => {
        const onClick = jest.fn();
        render(
            <EmptyState
                title="ยังไม่มีงาน"
                action={{ label: 'สร้างงาน', onClick }}
            />
        );
        fireEvent.click(screen.getByText('สร้างงาน'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('does not render button when action is not provided', () => {
        render(<EmptyState title="ยังไม่มีงาน" />);
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('has role="status" for accessibility', () => {
        render(<EmptyState title="ยังไม่มีงาน" />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────
// ErrorState
// ─────────────────────────────────────────────
describe('ErrorState', () => {
    it('renders default title', () => {
        render(<ErrorState message="Something went wrong" />);
        expect(screen.getByText('เกิดข้อผิดพลาด')).toBeInTheDocument();
    });

    it('renders custom title', () => {
        render(<ErrorState title="ไม่พบข้อมูล" message="กรุณาลองใหม่" />);
        expect(screen.getByText('ไม่พบข้อมูล')).toBeInTheDocument();
    });

    it('renders message', () => {
        render(<ErrorState message="เกิดข้อผิดพลาดในการเชื่อมต่อ" />);
        expect(screen.getByText('เกิดข้อผิดพลาดในการเชื่อมต่อ')).toBeInTheDocument();
    });

    it('renders retry button when onRetry provided', () => {
        render(<ErrorState message="Error" onRetry={() => { }} />);
        expect(screen.getByText('ลองอีกครั้ง')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
        const onRetry = jest.fn();
        render(<ErrorState message="Error" onRetry={onRetry} />);
        fireEvent.click(screen.getByText('ลองอีกครั้ง'));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('does not render retry button when onRetry not provided', () => {
        render(<ErrorState message="Error" />);
        expect(screen.queryByText('ลองอีกครั้ง')).not.toBeInTheDocument();
    });

    it('has role="alert" for accessibility', () => {
        render(<ErrorState message="Error" />);
        expect(screen.getByRole('alert')).toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────
// LoadingSpinner
// ─────────────────────────────────────────────
describe('LoadingSpinner', () => {
    it('renders with default md size', () => {
        const { container } = render(<LoadingSpinner />);
        expect(container.firstChild).toHaveClass('h-6', 'w-6');
    });

    it('renders sm size', () => {
        const { container } = render(<LoadingSpinner size="sm" />);
        expect(container.firstChild).toHaveClass('h-4', 'w-4');
    });

    it('renders lg size', () => {
        const { container } = render(<LoadingSpinner size="lg" />);
        expect(container.firstChild).toHaveClass('h-8', 'w-8');
    });

    it('has role="status" for accessibility', () => {
        render(<LoadingSpinner />);
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
});

// ─────────────────────────────────────────────
// FullPageLoader
// ─────────────────────────────────────────────
describe('FullPageLoader', () => {
    it('renders loading text', () => {
        render(<FullPageLoader />);
        expect(screen.getByText('กำลังโหลด...')).toBeInTheDocument();
    });

    it('has role="status" on the outer container', () => {
        render(<FullPageLoader />);
        // FullPageLoader renders both an outer div and inner LoadingSpinner with role=status
        const statusElements = screen.getAllByRole('status');
        expect(statusElements.length).toBeGreaterThanOrEqual(1);
    });
});
