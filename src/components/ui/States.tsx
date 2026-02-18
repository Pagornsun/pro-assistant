'use client';

import { ReactNode } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// ─────────────────────────────────────────────
// Skeleton — animated placeholder while loading
// ─────────────────────────────────────────────
interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div
            className={`animate-pulse rounded-xl bg-slate-200 dark:bg-zinc-800 ${className}`}
            aria-hidden="true"
        />
    );
}

// Preset: Task card skeleton
export function TaskCardSkeleton() {
    return (
        <div className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 gap-4">
            <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

// Preset: Dashboard stats card skeleton
export function StatCardSkeleton() {
    return (
        <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 border border-slate-100 dark:border-zinc-700">
            <Skeleton className="h-4 w-24 mb-3" />
            <Skeleton className="h-8 w-16" />
        </div>
    );
}

// ─────────────────────────────────────────────
// EmptyState — when there's no data to show
// ─────────────────────────────────────────────
interface EmptyStateProps {
    icon?: ReactNode;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
            role="status"
            aria-label={title}
        >
            {icon && (
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    {icon}
                </div>
            )}
            <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300 mb-1">{title}</h3>
            {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5">{description}</p>
            )}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark active:scale-95 transition-all"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// ErrorState — when something went wrong
// ─────────────────────────────────────────────
interface ErrorStateProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function ErrorState({
    title = 'เกิดข้อผิดพลาด',
    message,
    onRetry,
}: ErrorStateProps) {
    return (
        <div
            className="flex flex-col items-center justify-center py-12 px-6 text-center"
            role="alert"
            aria-live="assertive"
        >
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mb-4">
                <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mb-5">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="px-5 py-2.5 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all"
                >
                    ลองอีกครั้ง
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// LoadingSpinner — inline spinner
// ─────────────────────────────────────────────
interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeMap = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    return (
        <div
            className={`${sizeMap[size]} animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
            role="status"
            aria-label="กำลังโหลด..."
        />
    );
}

// ─────────────────────────────────────────────
// FullPageLoader — full screen loading state
// ─────────────────────────────────────────────
export function FullPageLoader() {
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-[#f6f6f8] dark:bg-zinc-950"
            role="status"
            aria-label="กำลังโหลด..."
        >
            <div className="flex flex-col items-center gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-slate-500 dark:text-slate-400">กำลังโหลด...</p>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// OfflineBanner — sticky banner when user is offline
// ─────────────────────────────────────────────
export function OfflineBanner() {
    const { isOnline } = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500 text-white text-sm font-semibold py-2.5 px-4 shadow-lg animate-in slide-in-from-top duration-300"
        >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01M8.464 15.536a5 5 0 010-7.072M5.636 18.364a9 9 0 010-12.728" />
            </svg>
            ไม่มีการเชื่อมต่ออินเทอร์เน็ต กรุณาตรวจสอบการเชื่อมต่อของคุณ
        </div>
    );
}

