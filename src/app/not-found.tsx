'use client';

import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mb-8 animate-bounce">
                <Search size={48} />
            </div>

            <h1 className="text-6xl font-black text-slate-900 dark:text-white mb-4">404</h1>
            <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-6">Oops! Page not found</h2>

            <p className="text-slate-500 dark:text-slate-400 max-w-md mb-10 leading-relaxed">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>

            <Link
                href="/dashboard"
                className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all active:scale-95 shadow-lg shadow-primary/20"
            >
                <Home size={20} />
                Back to Dashboard
            </Link>
        </div>
    );
}
