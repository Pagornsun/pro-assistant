'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLiff } from '@/components/providers/LiffProvider';

export default function TasksPage() {
    const router = useRouter();
    const { profile } = useLiff();
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.userId) {
            fetchTasks(profile.userId);
        }
    }, [profile]);

    async function fetchTasks(userId: string) {
        try {
            // Get profile id first
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('line_user_id', userId)
                .single();

            if (userProfile) {
                const { data } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false });

                if (data) setTasks(data);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">All Tasks</h1>
            </header>

            <div className="flex flex-col gap-3">
                {loading ? (
                    [1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">No tasks found.</div>
                ) : (
                    tasks.map(task => (
                        <div key={task.id} className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                                }`}>
                                {task.status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="ml-4 flex-1">
                                <h4 className="text-base font-bold text-slate-900 dark:text-white">{task.title}</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{task.description}</p>
                            </div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${task.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-primary/10 text-primary'
                                }`}>
                                {task.status === 'completed' ? 'Done' : 'Pending'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
