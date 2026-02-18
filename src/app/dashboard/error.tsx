'use client';

import { useEffect } from 'react';
import { RefreshCcw, AlertTriangle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                Something went wrong!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto">
                We encountered an unexpected error while loading the dashboard.
            </p>
            <button
                onClick={reset}
                className="flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
                <RefreshCcw size={18} />
                Try again
            </button>
        </div>
    );
}
