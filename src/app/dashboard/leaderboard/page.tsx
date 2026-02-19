'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import {
    Trophy,
    Users,
    Globe,
    ArrowLeft,
    Medal,
    TrendingUp
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import Image from 'next/image';

export default function LeaderboardPage() {
    const { profile } = useLiff();
    const router = useRouter();
    const [view, setView] = useState<'global' | 'group'>('global');
    const [rankings, setRankings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');

    useEffect(() => {
        if (profile?.userId) {
            fetchGroups();
            fetchRankings();
        }
    }, [profile, view, selectedGroupId]);

    async function fetchGroups() {
        try {
            const res = await fetch(`/api/groups?lineUserId=${profile?.userId}`);
            const data = await res.json();
            setGroups(data.groups || []);
            if (data.groups?.length > 0 && !selectedGroupId) {
                // Keep default empty or pick first? Let's stay on global by default
            }
        } catch (err) {
            console.error('Groups fetch error:', err);
        }
    }

    async function fetchRankings() {
        try {
            setLoading(true);
            const gid = view === 'group' ? selectedGroupId : '';
            const res = await fetch(`/api/leaderboard?lineUserId=${profile?.userId}&groupId=${gid}`);
            const data = await res.json();
            setRankings(data.rankings || []);
        } catch (err) {
            console.error('Rankings fetch error:', err);
        } finally {
            setLoading(false);
        }
    }

    const getMedalColor = (index: number) => {
        if (index === 0) return 'text-amber-400';
        if (index === 1) return 'text-slate-300';
        if (index === 2) return 'text-amber-700';
        return 'text-slate-400';
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold">Leaderboard</h1>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="bg-white dark:bg-zinc-900 p-1.5 rounded-2xl flex border border-slate-100 dark:border-zinc-800 shadow-sm">
                    <button
                        onClick={() => setView('global')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${view === 'global' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >
                        <Globe size={18} />
                        Global
                    </button>
                    <button
                        onClick={() => setView('group')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all ${view === 'group' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800'}`}
                    >
                        <Users size={18} />
                        Groups
                    </button>
                </div>

                {view === 'group' && groups.length > 0 && (
                    <select
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all shadow-sm"
                    >
                        <option value="">Select a Group</option>
                        {groups.map(g => (
                            <option key={g.id} value={g.id}>{g.name}</option>
                        ))}
                    </select>
                )}

                <DataStateHandler
                    isLoading={loading}
                    data={rankings}
                    isEmpty={rankings.length === 0}
                    emptyMessage={view === 'group' && !selectedGroupId ? 'Select a group to see rankings' : 'No rankings data yet'}
                >
                    {(data) => (
                        <div className="space-y-3">
                            {data.map((user, index) => (
                                <div
                                    key={user.id}
                                    className={`p-4 rounded-3xl flex items-center justify-between transition-all ${user.id === rankings.find(r => r.id === profile?.userId)?.id ? 'bg-primary/5 border-2 border-primary/20 scale-[1.02]' : 'bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-sm'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-zinc-800 overflow-hidden flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                                {user.profileUrl ? (
                                                    <img src={user.profileUrl} alt={user.displayName} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Users size={20} className="text-slate-400" />
                                                )}
                                            </div>
                                            {index < 3 && (
                                                <div className={`absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white dark:bg-zinc-900 shadow-md flex items-center justify-center ${getMedalColor(index)}`}>
                                                    <Medal size={14} />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold truncate max-w-[150px]">{user.displayName}</p>
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp size={12} className="text-emerald-500" />
                                                <p className="text-[10px] text-slate-500 font-medium">Rank #{index + 1}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="flex items-center gap-1.5 justify-end">
                                            <Trophy size={14} className="text-amber-400" />
                                            <p className="font-black text-slate-900 dark:text-white">{user.points.toLocaleString()}</p>
                                        </div>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Points</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DataStateHandler>
            </div>
        </div>
    );
}
