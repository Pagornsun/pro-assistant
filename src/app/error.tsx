'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Next.js Error Boundary:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-3xl flex items-center justify-center text-red-600 dark:text-red-400 mb-8">
                <AlertTriangle size={48} />
            </div>

            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-4">Something went wrong!</h1>

            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
                We apologize for the inconvenience. An unexpected error occurred. Please try refreshing the page or contact support if the problem persists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={() => reset()}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
                >
                    <RefreshCcw size={20} />
                    Try again
                </button>

                <Link
                    href="/dashboard"
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-white dark:bg-zinc-900 text-slate-900 dark:text-white border border-slate-200 dark:border-zinc-800 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all active:scale-95 shadow-sm"
                >
                    <Home size={20} />
                    Go Home
                </Link>
            </div>

            {process.env.NODE_ENV === 'development' && (
                <div className="mt-12 p-4 bg-charcoal text-left rounded-xl max-w-2xl overflow-auto text-xs font-mono text-emerald-400 border border-white/10">
                    <p className="mb-2 text-white/50">// Error Details (Only visible in development)</p>
                    <p>{error.message}</p>
                    {error.stack && <pre className="mt-2 text-white/30">{error.stack}</pre>}
                </div>
            )}
        </div>
    );
}
