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
    Crown,
    LogIn,
} from 'lucide-react';
import Link from 'next/link';

import { NewTaskModal } from '@/components/dashboard/NewTaskModal';
import { SettingsModal } from '@/components/dashboard/SettingsModal';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { DeleteTaskButton } from '@/components/dashboard/DeleteTaskButton';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { FullPageLoader, EmptyState, ErrorState, TaskCardSkeleton } from '@/components/ui/States';
import { Task } from '@/lib/types';

export default function UserDashboard() {
    const { profile, isLoggedIn, error, liff } = useLiff();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [membership, setMembership] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [usage, setUsage] = useState({ count: 0, limit: 5 });

    // Optimistic update: replace task in list immediately after save
    const handleTaskSaved = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    // Optimistic update: remove task from list immediately after delete
    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Check query params for payment status or actions
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                setPaymentStatus('success');
                setTimeout(() => setPaymentStatus(null), 5000);
            }
            // Auto-open New Task Modal
            if (urlParams.get('action') === 'new-task') {
                setIsTaskModalOpen(true);
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
        if (!lineUserId) return;
        try {
            setLoading(true);
            setFetchError(null);

            const res = await fetch(`/api/dashboard/data?lineUserId=${lineUserId}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const json = await res.json();
            const data = json.data ?? json;

            if (data.profile) {
                setMembership(data.membership || 'free');
                setTasks(data.tasks || []);
                setUsage({
                    count: data.usageCount || 0,
                    limit: data.usageLimit || 5
                });
            }
        } catch (err: unknown) { // Changed to err: unknown
            console.error('[Dashboard] Fetch error:', err); // Kept original console log for context
            setFetchError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'); // Changed setError to setFetchError
        } finally {
            setLoading(false);
        }
    }

    // Login Action
    const handleLogin = () => {
        if (!liff) {
            alert(`LIFF Init Failed: ${error || 'Unknown Error'}. Check console/network.`);
            return;
        }
        try {
            liff.login();
        } catch (err) {
            alert(`Login Error: ${err}`);
        }
    };

    // Derived State
    const activeTaskCount = tasks.filter(t => t.status === 'pending').length;

    // Loading State for initial LIFF load
    if (!isLoggedIn && loading && !fetchError) return <FullPageLoader />;

    return (
        <div className="min-h-screen flex justify-center bg-background-light dark:bg-zinc-950">
            <div className="w-full max-w-md bg-background-light dark:bg-zinc-950 relative flex flex-col min-h-screen shadow-2xl overflow-hidden">
                {/* Header... */}
                {/* Greeting... */}

                <header className="flex items-center justify-between px-6 pt-6 pb-2 sticky top-0 z-10 bg-background-light dark:bg-zinc-950">
                    <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Kinn</h1>
                    <button
                        onClick={() => window.close()}
                        aria-label="Close"
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-200/50 dark:bg-slate-800/50 hover:bg-slate-300/50 transition-colors text-slate-900 dark:text-white"
                    >
                        <X size={24} />
                    </button>
                </header>

                <main className="flex-1 px-6 pb-8 overflow-y-auto no-scrollbar">
                    <div className="mt-6 mb-8">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{dateString}</p>
                        <div className="flex items-end justify-between">
                            <h2 className="text-[28px] leading-[1.2] font-bold text-charcoal dark:text-white">
                                Good Morning, {profile?.displayName || 'Guest'}
                            </h2>
                            {!isLoggedIn && (
                                <button
                                    onClick={handleLogin}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-[#06C755] text-white rounded-lg font-bold text-xs shadow-md hover:bg-[#05b34c] transition-colors mb-1"
                                >
                                    <LogIn size={14} />
                                    Login
                                </button>
                            )}
                        </div>
                    </div>

                    <DataStateHandler
                        isLoading={loading && tasks.length === 0}
                        error={fetchError}
                        data={tasks}
                        onRetry={() => profile?.userId && fetchUserData(profile.userId)}
                    >
                        {(data) => (
                            <>
                                {/* Balance/Status Card */}
                                <div className="bg-charcoal dark:bg-zinc-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-200 dark:shadow-none mb-8 relative overflow-hidden group">
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

                                    {/* Progress Bar for Free Users */}
                                    {membership === 'free' && (
                                        <div className="mt-5 space-y-2 relative z-10">
                                            <div className="flex justify-between items-center text-xs font-medium">
                                                <span className="text-slate-400 uppercase tracking-wider">Usage Quota</span>
                                                <span className={`${usage.count >= usage.limit ? 'text-amber-400' : 'text-slate-300'}`}>
                                                    {usage.count} / {usage.limit} tasks today
                                                </span>
                                            </div>
                                            <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${usage.count >= usage.limit ? 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-primary shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                                                        }`}
                                                    style={{ width: `${Math.min((usage.count / usage.limit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                            {usage.count >= usage.limit && (
                                                <p className="text-[10px] text-amber-300/80 italic animate-pulse">
                                                    Daily limit reached. Upgrade to Pro for unlimited tasks.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* ... Rest of Dashboard ... */}
                            </>
                        )}
                    </DataStateHandler>


                    {/* Quick Task Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        {/* New Task (Primary Action) */}
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            data-testid="new-task-btn"
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

                        {/* User Profile */}
                        <Link href="/dashboard/profile" className="group flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <div className="w-6 h-6 rounded-full overflow-hidden">
                                    {profile?.pictureUrl ? <img src={profile.pictureUrl} alt="" className="w-full h-full" /> : <div className="w-full h-full bg-current opacity-50" />}
                                </div>
                            </div>
                            <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">My<br />Profile</span>
                        </Link>

                        {/* Subscription (formerly Settings) */}
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            className="group flex flex-col items-start justify-between p-5 h-36 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                                <Crown size={24} />
                            </div>
                            <span className="font-bold text-lg leading-tight text-slate-900 dark:text-white">Upgrade<br />Plan</span>
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

                        <DataStateHandler
                            isLoading={loading}
                            error={fetchError}
                            data={tasks}
                            isEmpty={tasks.length === 0}
                            loadingSkeleton={
                                <div className="flex flex-col gap-3">
                                    {[1, 2, 3].map(i => <TaskCardSkeleton key={i} />)}
                                </div>
                            }
                            emptyState={
                                <EmptyState
                                    title="ยังไม่มีงาน"
                                    description="กดปุ่ม New Task เพื่อสร้างงานใหม่ หรือส่งข้อความหา Kinn ใน LINE"
                                />
                            }
                            onRetry={() => profile?.userId && fetchUserData(profile.userId)}
                        >
                            {(data) => (
                                <div className="flex flex-col gap-3">
                                    {data.slice(0, 5).map(task => (
                                        <div
                                            key={task.id}
                                            className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                                            onClick={() => { setSelectedTask(task); setIsEditModalOpen(true); }}
                                        >
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${task.status === 'done' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                                                }`}>
                                                {task.status === 'done' ? <CheckCircle size={20} /> : <Clock size={20} />}
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2 ml-2" onClick={e => e.stopPropagation()}>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${task.status === 'done'
                                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                                    : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {task.status === 'done' ? 'Done' : task.status === 'processing' ? 'In Progress' : 'Pending'}
                                                </span>
                                                <DeleteTaskButton
                                                    taskId={task.id}
                                                    taskTitle={task.title}
                                                    lineUserId={profile?.userId || ''}
                                                    onDeleted={() => handleTaskDeleted(task.id)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </DataStateHandler>
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
            <EditTaskModal
                task={selectedTask}
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                onSaved={handleTaskSaved}
                lineUserId={profile?.userId || ''}
            />

            {/* Payment Toast */}
            {paymentStatus === 'success' && (
                <div className="fixed bottom-6 left-6 right-6 bg-emerald-500 text-white p-4 rounded-xl shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-5">
                    <CheckCircle size={20} /> Payment Successful! Welcome to Pro.
                </div>
            )}
        </div>
    );
}
