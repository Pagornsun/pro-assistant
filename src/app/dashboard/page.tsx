'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Calendar,
    Settings,
    Headphones, // Support Agent
    Plane,      // Flight
    Utensils,   // Dinner
    Gift,       // Gift
    CheckCircle,
    Clock,
    X,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { NewTaskModal } from '@/components/dashboard/NewTaskModal';
import { SettingsModal } from '@/components/dashboard/SettingsModal';

export default function UserDashboard() {
    const { profile, isLoggedIn, error } = useLiff();
    const [tasks, setTasks] = useState<any[]>([]);
    const [membership, setMembership] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);

    // Check query params for payment status
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                setPaymentStatus('success');
                setTimeout(() => setPaymentStatus(null), 5000);
            }
        }
    }, []);

    // Date Formatting
    const today = new Date();
    const dateString = today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });

    useEffect(() => {
        if (profile?.userId) {
            fetchUserData(profile.userId);
        } else if (error) {
            setLoading(false);
        }
    }, [profile, error]);

    async function fetchUserData(lineUserId: string) {
        try {
            setLoading(true);
            // 1. Get Profile & Membership
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('id, tier')
                .eq('line_user_id', lineUserId)
                .single();

            if (userProfile) {
                setMembership(userProfile.tier);

                // 2. Get Tasks
                const { data: userTasks } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false })
                    .limit(5); // Limit for "Recent Tasks" view

                if (userTasks) setTasks(userTasks);
            }
        } catch (err) {
            console.error('Fetch Data Error:', err);
        } finally {
            setLoading(false);
        }
    }

    // Derived State
    const activeTaskCount = tasks.filter(t => t.status === 'pending').length;

    if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;
    if (!isLoggedIn && loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>;

    return (
        <div className="min-h-screen flex justify-center bg-background-light dark:bg-zinc-950">
            <div className="w-full max-w-md bg-background-light dark:bg-zinc-950 relative flex flex-col min-h-screen shadow-2xl overflow-hidden">

                {/* Header */}
                <header className="flex items-center justify-between px-6 pt-6 pb-2 sticky top-0 z-10 bg-background-light dark:bg-zinc-950">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Kinn</h1>
                    <button
                        onClick={() => window.close()} // LIFF close window
                        aria-label="Close"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300/50 transition-colors text-slate-900 dark:text-white"
                    >
                        <X size={24} />
                    </button>
                </header>

                {/* Main Content */}
                <main className="flex-1 px-6 pb-8 overflow-y-auto no-scrollbar">

                    {/* Greeting */}
                    <div className="mt-6 mb-8">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{dateString}</p>
                        <h2 className="text-[28px] leading-[1.2] font-bold text-charcoal dark:text-white">
                            Good Morning,<br />
                            {profile?.displayName || 'Guest'}
                        </h2>
                    </div>

                    {/* Balance/Status Card */}
                    <div className="bg-charcoal dark:bg-zinc-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none mb-8 relative overflow-hidden group">
                        {/* Abstract Decorative gradient */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none"></div>

                        <div className="flex gap-6 relative z-10">
                            <div className="flex-1 flex flex-col gap-1">
                                <span className="text-slate-400 text-sm font-medium">Active Task</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold tracking-tight">{activeTaskCount}</span>
                                    {activeTaskCount > 0 && <span className="w-2 h-2 bg-primary rounded-full mb-2 animate-pulse"></span>}
                                </div>
                            </div>
                            <div className="w-px bg-white/10 my-1"></div>
                            <div className="flex-1 flex flex-col gap-1">
                                <span className="text-slate-400 text-sm font-medium">Plan</span>
                                <span className="text-2xl font-bold tracking-tight mt-auto capitalize text-primary-300">{membership}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Task Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* New Task (Primary Action) */}
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="group relative flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-1 transition-all duration-300 active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                                <Plus size={24} />
                            </div>
                            <span className="font-bold text-lg leading-tight">New<br />Task</span>
                        </button>

                        {/* My Calendar */}
                        <Link href="/dashboard/calendar" className="group flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Calendar size={24} />
                            </div>
                            <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">My<br />Calendar</span>
                        </Link>

                        {/* Assistant Settings */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="group flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Settings size={24} />
                            </div>
                            <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Assistant<br />Settings</span>
                        </button>

                        {/* Help Center */}
                        <Link href="/dashboard/help" className="group flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                <Headphones size={24} />
                            </div>
                            <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Help<br />Center</span>
                        </Link>
                    </div>

                    {/* Recent Tasks List */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Recent Tasks</h3>
                            <Link className="text-sm font-semibold text-primary hover:text-primary/80" href="/dashboard/tasks">View All</Link>
                        </div>

                        <div className="flex flex-col gap-3">
                            {loading ? (
                                [1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-xl animate-pulse" />)
                            ) : tasks.length === 0 ? (
                                <div className="text-center py-8 text-slate-400">No tasks yet.</div>
                            ) : (
                                tasks.map(task => (
                                    <div key={task.id} className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm active:scale-[0.98] transition-transform cursor-pointer">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                                            }`}>
                                            {task.status === 'completed' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                        </div>
                                        <div className="ml-4 flex-1 min-w-0">
                                            <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${task.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                : 'bg-primary/10 text-primary'
                                                }`}>
                                                {task.status === 'completed' ? 'Done' : 'Pending'}
                                            </span>
                                        </div>
                                        <div className="ml-2 text-slate-300 dark:text-slate-600">
                                            <ChevronRight size={20} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="h-8"></div> {/* Bottom Spacer */}
                </main>
            </div>

            {/* Desktop Preview Background */}
            <div className="fixed inset-0 -z-10 bg-slate-200 dark:bg-black hidden sm:block">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-mono text-sm pointer-events-none">
                    Desktop Preview Mode (Mobile First)
                </div>
            </div>

            {/* Modals */}
            <NewTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} membership={membership} />

            {/* Payment Toast */}
            {paymentStatus === 'success' && (
                <div className="fixed bottom-6 left-6 right-6 bg-emerald-500 text-white p-4 rounded-xl shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-5">
                    <CheckCircle size={20} /> Payment Successful! Welcome to Pro.
                </div>
            )}
        </div>
    );
}
