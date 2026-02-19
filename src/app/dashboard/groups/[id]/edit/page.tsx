'use client';

import React, { useEffect, useState, use } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import {
    ArrowLeft,
    Save,
    Trash2,
    AlertCircle,
    Users,
    UserX,
    Shield
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { DataStateHandler } from '@/components/shared/DataStateHandler';

export default function GroupSettingsPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const groupId = params.id;
    const { profile } = useLiff();
    const router = useRouter();

    const [name, setName] = useState('');
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [groupData, setGroupData] = useState<any>(null);

    useEffect(() => {
        if (profile?.userId && groupId) {
            fetchGroupDetails();
        }
    }, [profile, groupId]);

    async function fetchGroupDetails() {
        try {
            setLoading(true);
            const res = await fetch(`/api/groups/${groupId}?lineUserId=${profile?.userId}`);
            if (!res.ok) throw new Error('Failed to fetch group');
            const data = await res.json();
            setGroupData(data.group);
            setName(data.group.name);
            setMembers(data.members || []);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load group details');
        } finally {
            setLoading(false);
        }
    }

    async function handleRename() {
        if (!name.trim()) return toast.error('Please enter a group name');
        try {
            setIsSaving(true);
            const res = await fetch(`/api/groups/${groupId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-line-user-id': profile?.userId || ''
                },
                body: JSON.stringify({ name: name.trim() })
            });
            if (!res.ok) throw new Error('Update failed');
            toast.success('Group renamed successfully');
        } catch (err) {
            toast.error('Failed to update group name');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm('Are you sure you want to delete this group? This action cannot be undone.')) return;
        try {
            setIsDeleting(true);
            const res = await fetch(`/api/groups/${groupId}`, {
                method: 'DELETE',
                headers: { 'x-line-user-id': profile?.userId || '' }
            });
            if (!res.ok) throw new Error('Delete failed');
            toast.success('Group deleted');
            router.push('/dashboard/groups');
        } catch (err) {
            toast.error('Only the owner can delete this group');
        } finally {
            setIsDeleting(false);
        }
    }

    async function removeMember(memberId: string) {
        if (!confirm('Remove this member?')) return;
        try {
            const res = await fetch(`/api/groups/${groupId}/members/${memberId}`, {
                method: 'DELETE',
                headers: { 'x-line-user-id': profile?.userId || '' }
            });
            if (!res.ok) throw new Error('Remove failed');
            setMembers(members.filter(m => m.id !== memberId));
            toast.success('Member removed');
        } catch (err) {
            toast.error('Failed to remove member');
        }
    }

    const isOwner = groupData?.owner_id === profile?.userId; // This check might need profile.id instead of userId depending on API return

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-white dark:hover:bg-zinc-900 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold">Group Settings</h1>
                </div>

                <DataStateHandler isLoading={loading} data={groupData}>
                    {() => (
                        <div className="space-y-8">
                            {/* Rename Section */}
                            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-slate-100 dark:border-zinc-800 shadow-sm space-y-4">
                                <label className="block text-sm font-bold text-slate-500">Group Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full p-4 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-bold focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                />
                                <button
                                    onClick={handleRename}
                                    disabled={isSaving}
                                    className="w-full py-4 bg-primary text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-primary-dark transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>

                            {/* Member Management */}
                            <div className="space-y-4">
                                <h2 className="font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                                    <Users size={18} className="text-primary" />
                                    Manage Members ({members.length})
                                </h2>
                                <div className="space-y-2">
                                    {members.map(member => (
                                        <div key={member.id} className="p-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-400">
                                                    <Users size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{member.name || 'Member'}</p>
                                                    <div className="flex items-center gap-1">
                                                        {member.role === 'admin' && <Shield size={12} className="text-amber-500" />}
                                                        <p className="text-[10px] text-slate-500 uppercase font-black">{member.role}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {member.id !== groupData.owner_id && (
                                                <button
                                                    onClick={() => removeMember(member.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                                                >
                                                    <UserX size={18} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="pt-6 border-t border-slate-200 dark:border-zinc-800 space-y-4">
                                <div className="p-4 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 flex gap-3">
                                    <AlertCircle className="text-red-500 shrink-0" size={20} />
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-red-900 dark:text-red-400">Danger Zone</p>
                                        <p className="text-xs text-red-700 dark:text-red-400/70">Deleting a group will permanently remove all shared tasks and data related to this group.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className="w-full py-4 border-2 border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-500 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-red-600 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <Trash2 size={18} />
                                    {isDeleting ? 'Deleting...' : 'Delete Group'}
                                </button>
                            </div>
                        </div>
                    )}
                </DataStateHandler>
            </div>
        </div>
    );
}
