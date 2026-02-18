'use client';

import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Users, CheckCircle, TrendingUp, Activity } from 'lucide-react';
// We don't have chart.js installed. Just Stats Cards.

interface Stats {
    totalUsers: number;
    totalTasks: number;
    activeUsers: number;
    mrr: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.status === 401 || res.status === 403) {
                setError('Unauthorized access');
                setLoading(false);
                return;
            }
            const json = await res.json();
            if (json.data) {
                setStats(json.data);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load stats');
        } finally {
            setLoading(false);
        }
    };

    if (error) return (
        <AdminLayout>
            <div className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">{error}</div>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
                <p className="text-gray-400 text-sm">Welcome back, Admin.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-800 rounded-2xl animate-pulse" />)}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Total Users"
                        value={stats?.totalUsers.toLocaleString() || '0'}
                        icon={Users}
                        trend="+5% vs last week"
                        color="text-blue-400 bg-blue-400/10"
                    />
                    <StatCard
                        title="Active Users (7d)"
                        value={stats?.activeUsers.toLocaleString() || '0'}
                        icon={Activity}
                        trend="Stable"
                        color="text-emerald-400 bg-emerald-400/10"
                    />
                    <StatCard
                        title="Total Tasks"
                        value={stats?.totalTasks.toLocaleString() || '0'}
                        icon={CheckCircle}
                        trend="Growing"
                        color="text-purple-400 bg-purple-400/10"
                    />
                    <StatCard
                        title="Est. MRR"
                        value={`฿${stats?.mrr.toLocaleString() || '0'}`}
                        icon={TrendingUp}
                        trend="Pro Subscriptions"
                        color="text-amber-400 bg-amber-400/10"
                    />
                </div>
            )}
        </AdminLayout>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    return (
        <div className="bg-gray-800 border border-gray-700/50 p-6 rounded-2xl shadow-xl">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={24} />
                </div>
                {/* <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">{trend}</span> */}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-white">{value}</h3>
            </div>
            <div className="mt-4 text-xs text-gray-500">
                {trend}
            </div>
        </div>
    );
}
