'use client';

import React, { useEffect, useState, use } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import {
    Users,
    ArrowLeft,
    UserPlus,
    MoreVertical,
    Shield,
    Calendar,
    ChevronRight,
    Trophy
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DataStateHandler } from '@/components/shared/DataStateHandler';

export default function GroupDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const groupId = params.id;
    const { profile } = useLiff();
    const router = useRouter();
    const [group, setGroup] = useState<any>(null);
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile?.userId && groupId) {
            fetchGroupData();
        }
    }, [profile, groupId]);

    async function fetchGroupData() {
        try {
            setLoading(true);
            const res = await fetch(`/api/groups/${groupId}?lineUserId=${profile?.userId || ''}`);
            if (!res.ok) throw new Error('Failed to fetch group');
            const data = await res.json();
            setGroup(data.group);
            setMembers(data.members || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold">{group?.name || 'Loading...'}</h1>
                            <p className="text-xs text-slate-500">Shared Workspace</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/dashboard/groups/${groupId}/edit`)}
                        className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition-colors text-slate-500"
                    >
                        <Shield size={20} />
                    </button>
                </div>

                <div className="bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-primary/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                                <Trophy size={24} />
                            </div>
                            <div>
                                <p className="text-xs opacity-80">Group Points</p>
                                <p className="text-2xl font-bold">{group?.total_points || 0} pts</p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                        <div className="bg-white h-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-[10px] mt-2 opacity-70">Weekly Goal: Reach 1,000 pts to unlock new theme!</p>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2">
                            <Users size={18} className="text-primary" />
                            Members ({members.length})
                        </h2>
                        <button className="text-sm font-bold text-primary flex items-center gap-1">
                            <UserPlus size={16} /> Invite
                        </button>
                    </div>

                    <DataStateHandler
                        isLoading={loading}
                        data={members}
                        isEmpty={members.length === 0}
                    >
                        {(data) => (
                            <div className="space-y-2">
                                {data.map((member) => (
                                    <div key={member.id} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-500">
                                                <Users size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{member.name || 'Group Member'}</p>
                                                <p className="text-[10px] text-slate-500">{member.role.toUpperCase()}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-emerald-500">{member.points || 0} pts</span>
                                            {member.role === 'admin' && <Shield size={14} className="text-amber-500" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DataStateHandler>
                </div>

                {/* Shared Tasks History or Settings can go here */}
                <div className="pt-6 border-t border-slate-100 dark:border-zinc-800">
                    <button
                        onClick={() => router.push(`/dashboard/tasks?groupId=${groupId}`)}
                        className="w-full p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 flex items-center justify-between hover:border-primary transition-colors font-bold"
                    >
                        <div className="flex items-center gap-3">
                            <Calendar size={20} className="text-primary" />
                            <span>View Shared Tasks</span>
                        </div>
                        <ChevronRight size={20} className="text-slate-300" />
                    </button>
                </div>
            </div>
        </div>
    );
}
