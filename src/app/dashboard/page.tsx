'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function UserDashboard() {
    const { profile, isLoggedIn, error } = useLiff();
    const [tasks, setTasks] = useState<any[]>([]);
    const [membership, setMembership] = useState<string>('free');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (profile?.userId) {
            fetchUserData(profile.userId);
        }
    }, [profile]);

    async function fetchUserData(lineUserId: string) {
        setLoading(true);
        try {
            // 1. Get Profile & Membership
            const { data: userProfile, error: userError } = await supabase
                .from('profiles')
                .select('id, tier')
                .eq('line_user_id', lineUserId)
                .single();

            if (userProfile) {
                setMembership(userProfile.tier);

                // 2. Get Tasks
                const { data: userTasks, error: taskError } = await supabase
                    .from('tasks')
                    .select('*')
                    .eq('user_id', userProfile.id)
                    .order('created_at', { ascending: false });

                if (userTasks) setTasks(userTasks);
            }
        } catch (err) {
            console.error('Fetch Data Error:', err);
        } finally {
            setLoading(false);
        }
    }

    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
    if (!isLoggedIn) return <div className="p-4 text-center">Loading LIFF... (Please open in LINE)</div>;

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    {profile?.pictureUrl ? (
                        <img src={profile.pictureUrl} alt="Profile" className="w-10 h-10 rounded-full" />
                    ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full" />
                    )}
                    <div>
                        <h1 className="font-bold text-gray-800">{profile?.displayName}</h1>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${membership === 'executive' ? 'bg-purple-100 text-purple-700' :
                                membership === 'pro' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                            }`}>
                            {membership.toUpperCase()} MEMBER
                        </span>
                    </div>
                </div>
            </div>

            {/* Stats/Action */}
            <div className="p-4">
                {membership === 'free' && (
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white shadow-lg mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-lg mb-1">Upgrade to Pro</h2>
                                <p className="text-sm opacity-90 mb-3">Unlock unlimited tasks & faster AI.</p>
                                <button className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition-transform">
                                    Upgrade Now
                                </button>
                            </div>
                            <ShieldCheck className="w-12 h-12 opacity-20" />
                        </div>
                    </div>
                )}

                {/* Task List */}
                <h2 className="font-bold text-gray-700 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    My Tasks
                </h2>

                {loading ? (
                    <div className="space-y-3 animate-pulse">
                        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>)}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <p>No tasks found.</p>
                        <p className="text-sm">Type to the bot to create one!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {tasks.map(task => (
                            <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-start">
                                <div>
                                    <h3 className="font-medium text-gray-800">{task.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                                    <span className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {task.status.toUpperCase()}
                                    </span>
                                </div>
                                {task.status === 'completed' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
