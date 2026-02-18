
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { ProfileForm } from '@/components/dashboard/ProfileForm';

export default function ProfilePage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-8 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">User Profile</h1>
            </header>

            <main>
                <ProfileForm />
            </main>
        </div>
    );
}
