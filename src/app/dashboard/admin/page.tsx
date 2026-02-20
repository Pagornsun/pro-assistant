'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Users,
    CheckSquare,
    Activity,
    RefreshCcw
} from 'lucide-react';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { StatCardSkeleton } from '@/components/ui/States';

interface AdminStats {
    totalUsers: number;
    totalTasks: number;
    activeTasks: number;
}

interface UserProfile {
    id: string;
    line_user_id: string;
    display_name?: string;
    picture_url?: string;
    tier: string;
    created_at: string;
    points: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch('/api/admin/stats');
            if (!res.ok) throw new Error('Failed to fetch admin data');
            const json = await res.json();

            if (json.data) {
                setStats(json.data.stats);
                setUsers(json.data.recentUsers);
            }
        } catch (err) {
            console.error(err);
            setError('Could not load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 text-slate-900 dark:text-white pb-10">
            {/* Header */}
            <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-10 bg-background-light/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>
                <button onClick={fetchData} disabled={loading} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                    <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </header>

            <main className="px-6 py-6 max-w-4xl mx-auto space-y-8">

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {loading && !stats ? (
                        <>
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                            <StatCardSkeleton />
                        </>
                    ) : (
                        <>
                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                        <Users size={24} />
                                    </div>
                                    <span className="text-slate-500 font-medium">Total Users</span>
                                </div>
                                <span className="text-3xl font-bold">{stats?.totalUsers.toLocaleString()}</span>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-xl">
                                        <CheckSquare size={24} />
                                    </div>
                                    <span className="text-slate-500 font-medium">Total Tasks</span>
                                </div>
                                <span className="text-3xl font-bold">{stats?.totalTasks.toLocaleString()}</span>
                            </div>

                            <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-zinc-800">
                                <div className="flex items-center gap-4 mb-2">
                                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                                        <Activity size={24} />
                                    </div>
                                    <span className="text-slate-500 font-medium">Active Tasks</span>
                                </div>
                                <span className="text-3xl font-bold">{stats?.activeTasks.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Recent Users Table */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold">Recent Users</h2>
                    <DataStateHandler isLoading={loading} error={error} data={users} isEmpty={users.length === 0} onRetry={fetchData}>
                        {(data) => (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 dark:bg-zinc-800/50 text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4 font-medium">User</th>
                                            <th className="px-6 py-4 font-medium">Tier</th>
                                            <th className="px-6 py-4 font-medium">Points</th>
                                            <th className="px-6 py-4 font-medium">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                                        {data.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-700 overflow-hidden">
                                                            {user.picture_url ? (
                                                                <img src={user.picture_url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="flex items-center justify-center h-full text-xs font-bold text-slate-500">
                                                                    {user.display_name?.[0] || 'U'}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-slate-900 dark:text-white">
                                                                {user.display_name || 'Unknown User'}
                                                            </span>
                                                            <span className="text-xs text-slate-400 font-mono">
                                                                {user.line_user_id.slice(0, 8)}...
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${user.tier === 'pro'
                                                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                                        }`}>
                                                        {user.tier}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium text-emerald-500">
                                                    {user.points || 0}
                                                </td>
                                                <td className="px-6 py-4 text-slate-500">
                                                    {new Date(user.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </DataStateHandler>
                </div>

            </main>
        </div>
    );
}
