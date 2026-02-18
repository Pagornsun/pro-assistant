'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLiff } from '@/components/providers/LiffProvider';

import { TaskSearch } from '@/components/dashboard/TaskSearch';

export default function TasksPage() {
    const router = useRouter();
    const { profile } = useLiff();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams, setSearchParams] = useState({ query: '', status: 'all' });

    useEffect(() => {
        if (profile?.userId) {
            fetchTasks(profile.userId, searchParams.query, searchParams.status);
        }
    }, [profile, searchParams]);

    async function fetchTasks(userId: string, query: string, status: string) {
        try {
            setLoading(true);
            // Get profile id first (API handles this now actually, but let's stick to consistent client flow if needed, 
            // BUT api/tasks expects lineUserId query param directly!! The previous code was fetching profile first manually.
            // The NEW api/tasks accepts lineUserId directly. We can simplify this!)

            // New API usage: /api/tasks?lineUserId=...&search=...&status=...
            const params = new URLSearchParams({
                lineUserId: userId,
                limit: '50', // Higher limit for "All Tasks" view
            });

            if (query) params.append('search', query);
            if (status && status !== 'all') params.append('status', status);

            const res = await fetch(`/api/tasks?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');

            const json = await res.json();
            const data = json.data?.tasks || json.tasks || [];

            console.log('Fetched tasks:', data); // Debug

            setTasks(data);
        } catch (error) {
            console.error('Fetch error:', error);
            // Optional: toast.error('Failed to load tasks');
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (query: string, status: string) => {
        setSearchParams({ query, status });
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">All Tasks</h1>
            </header>

            <TaskSearch onSearch={handleSearch} />

            <div className="flex flex-col gap-3">
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                            <Clock size={32} className="opacity-50" />
                        </div>
                        <p>No tasks found matching your criteria.</p>
                    </div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm active:scale-[0.99] transition-transform">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'done' || task.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                                }`}>
                                {(task.status === 'done' || task.status === 'completed') ? <CheckCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="ml-4 flex-1 min-w-0">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ml-2 whitespace-nowrap ${task.status === 'done' || task.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-primary/10 text-primary'
                                }`}>
                                {task.status === 'done' || task.status === 'completed' ? 'Done' : task.status === 'processing' ? 'In Progress' : 'Pending'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
