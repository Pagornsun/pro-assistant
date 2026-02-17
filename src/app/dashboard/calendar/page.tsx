'use client';
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CalendarPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">My Calendar</h1>
            </header>

            <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📅</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Coming Soon</h2>
                <p className="text-slate-500 max-w-xs">
                    We are building a smart calendar view for you. Stay tuned!
                </p>
            </div>
        </div>
    );
}
