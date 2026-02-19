'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { supabase } from '@/lib/supabase';
import {
    Users,
    Plus,
    ChevronRight,
    UserPlus,
    Shield,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DataStateHandler } from '@/components/shared/DataStateHandler';

export default function GroupsPage() {
    const { profile, isLoggedIn } = useLiff();
    const router = useRouter();
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        if (profile?.userId) {
            fetchGroups();
        }
    }, [profile]);

    async function fetchGroups() {
        try {
            setLoading(true);
            const res = await fetch(`/api/groups?lineUserId=${profile?.userId}`);
            if (!res.ok) throw new Error('Failed to fetch groups');
            const data = await res.json();
            setGroups(data.groups || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleCreateGroup() {
        if (!newGroupName.trim()) return;
        try {
            const res = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'x-line-user-id': profile?.userId || '',
                    'Content-Type': 'application/json'
                } as any,
                body: JSON.stringify({ name: newGroupName })
            });
            if (!res.ok) throw new Error('Create failed');
            toast.success('Group created!');
            setNewGroupName('');
            setIsCreateModalOpen(false);
            fetchGroups();
        } catch (err) {
            toast.error('Failed to create group');
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">My Groups</h1>
                </div>

                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-full p-4 bg-primary text-white rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform"
                >
                    <Plus size={20} />
                    Create New Group
                </button>

                <DataStateHandler
                    isLoading={loading}
                    data={groups}
                    isEmpty={groups.length === 0}
                    emptyState={
                        <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
                            <Users size={48} className="mx-auto text-slate-300 mb-4" />
                            <p className="text-slate-500">You don't have any groups yet.</p>
                        </div>
                    }
                >
                    {(data) => (
                        <div className="space-y-3">
                            {data.map((group) => (
                                <div
                                    key={group.id}
                                    className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-sm flex items-center justify-between group cursor-pointer hover:border-primary transition-colors"
                                    onClick={() => router.push(`/dashboard/groups/${group.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-slate-400">
                                            <Users size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold">{group.name}</h3>
                                            <p className="text-xs text-slate-500">{group.member_count} members</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-300 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    )}
                </DataStateHandler>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold mb-4">Create Group</h2>
                        <input
                            type="text"
                            placeholder="Group Name (e.g. Family, Office)"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-2xl mb-6 outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="flex-1 p-4 font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-2xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!newGroupName.trim()}
                                className="flex-1 p-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
