
'use client';

import React, { useEffect, useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface TaskSearchProps {
    onSearch: (query: string, status: string) => void;
}

export function TaskSearch({ onSearch }: TaskSearchProps) {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('all');

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            onSearch(query, status);
        }, 500);

        return () => clearTimeout(timer);
    }, [query, status, onSearch]);

    return (
        <div className="flex flex-col gap-3 mb-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search tasks..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'processing', label: 'In Progress' },
                    { id: 'done', label: 'Done' },
                ].map((s) => (
                    <button
                        key={s.id}
                        onClick={() => setStatus(s.id)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-colors ${status === s.id
                                ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-black dark:border-white'
                                : 'bg-white dark:bg-zinc-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-zinc-700 hover:border-slate-300 dark:hover:border-zinc-600'
                            }`}
                    >
                        {s.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
