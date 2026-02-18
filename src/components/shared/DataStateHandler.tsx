'use client';

import { ReactNode } from 'react';
import { ErrorState, LoadingSpinner } from '../ui/States';

interface DataStateHandlerProps<T> {
    isLoading: boolean;
    error?: Error | null | string;
    data?: T;
    isEmpty?: boolean;
    children: (data: T) => ReactNode;
    emptyState?: ReactNode;
    loadingSkeleton?: ReactNode;
    onRetry?: () => void;
}

/**
 * DataStateHandler — standardized wrapper for handling Loading, Error, Empty, and Success states.
 * Follows the patterns defined in ui_states_design_guide.md.
 */
export function DataStateHandler<T>({
    isLoading,
    error,
    data,
    isEmpty = false,
    children,
    emptyState,
    loadingSkeleton,
    onRetry,
}: DataStateHandlerProps<T>) {
    // 1. Loading State
    if (isLoading) {
        return loadingSkeleton || (
            <div className="flex justify-center py-10">
                <LoadingSpinner />
            </div>
        );
    }

    // 2. Error State
    if (error) {
        const message = typeof error === 'string' ? error : error.message;
        return (
            <ErrorState
                title="เกิดข้อผิดพลาด"
                message={message || 'ไม่สามารถโหลดข้อมูลได้'}
                onRetry={onRetry}
            />
        );
    }

    // 3. Empty State
    if (isEmpty || !data || (Array.isArray(data) && data.length === 0)) {
        return (
            <div className="animate-in fade-in duration-500">
                {emptyState || (
                    <div className="text-center py-10 text-slate-500 dark:text-slate-400">
                        ไม่มีข้อมูลจะแสดงในขณะนี้
                    </div>
                )}
            </div>
        );
    }

    // 4. Success State (Render Child)
    return <div className="animate-in fade-in duration-500">{children(data)}</div>;
}
