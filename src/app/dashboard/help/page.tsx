'use client';
import React from 'react';
import { ChevronLeft, MessageCircle, Mail, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HelpPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">Help Center</h1>
            </header>

            <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <MessageCircle size={20} className="text-primary" />
                        Chat with Support
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                        Talk to our support team directly via LINE.
                    </p>
                    <button className="w-full py-2 bg-primary text-white rounded-lg font-medium text-sm">
                        Open Chat
                    </button>
                </div>

                <div className="p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                    <h3 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                        <FileText size={20} className="text-primary" />
                        Common Questions
                    </h3>
                    <ul className="text-sm text-slate-500 dark:text-slate-400 space-y-2 list-disc list-inside">
                        <li>How to create a task?</li>
                        <li>How to upgrade to Pro?</li>
                        <li>Can I cancel anytime?</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
