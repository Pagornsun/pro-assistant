'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/schemas';
import { User, Save, Loader2, Moon, Sun, Monitor, Bell, Globe, Calendar } from 'lucide-react';
import { useLiff } from '@/components/providers/LiffProvider';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { UserProfile } from '@/lib/types';
import toast from 'react-hot-toast';

export function ProfileForm() {
    const { profile: liffProfile } = useLiff();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfile | null>(null);

    const form = useForm<UpdateProfileInput>({
        resolver: zodResolver(updateProfileSchema),
        defaultValues: {
            preferences: {
                theme: 'system',
                language: 'th',
                notifications: true,
            },
        },
    });

    useEffect(() => {
        if (liffProfile?.userId) {
            fetchProfile(liffProfile.userId);
        }
    }, [liffProfile]);

    async function fetchProfile(lineUserId: string) {
        try {
            setIsLoading(true);
            setFetchError(null);
            const res = await fetch(`/api/profile?lineUserId=${lineUserId}`);
            if (!res.ok) throw new Error('Failed to fetch profile');
            const apiResponse = await res.json();
            const data = apiResponse.data ?? apiResponse;

            setProfileData(data);

            if (data.preferences) {
                form.reset({
                    preferences: {
                        theme: data.preferences.theme || 'system',
                        language: data.preferences.language || 'th',
                        notifications: data.preferences.notifications ?? true,
                    }
                });
            }
        } catch (error) {
            console.error('Fetch profile error:', error);
            setFetchError('ไม่สามารถโหลดข้อมูลโปรไฟล์ได้');
        } finally {
            setIsLoading(false);
        }
    }

    async function onSubmit(data: UpdateProfileInput) {
        if (!liffProfile?.userId) return;

        try {
            setIsSaving(true);
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lineUserId: liffProfile.userId,
                    preferences: data.preferences,
                }),
            });

            if (!res.ok) throw new Error('Failed to update');

            toast.success('บันทึกข้อมูลเรียบร้อยแล้ว');
        } catch (err: unknown) {
            console.error('Update profile error:', err);
            toast.error('เกิดข้อผิดพลาดในการบันทึก');
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading && !profileData) {
        return (
            <div className="max-w-xl mx-auto space-y-8 animate-pulse">
                <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-700 shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-zinc-700 rounded" />
                        <div className="h-3 w-20 bg-slate-100 dark:bg-zinc-800 rounded" />
                    </div>
                </div>
                <div className="h-64 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm" />
            </div>
        );
    }

    return (
        <DataStateHandler
            isLoading={isLoading && !profileData}
            error={fetchError}
            data={profileData || undefined}
            onRetry={() => liffProfile?.userId && fetchProfile(liffProfile.userId)}
        >
            {(data: UserProfile) => (
                <div className="max-w-xl mx-auto space-y-8">
                    {/* Header Info */}
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
                        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
                            {liffProfile?.pictureUrl ? (
                                <img src={liffProfile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User size={32} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{liffProfile?.displayName || 'Guest'}</h2>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary uppercase tracking-wide">
                                {data?.tier || 'Free'} Plan
                            </span>
                            <p className="text-xs text-slate-400 mt-1">LINE User ID: {liffProfile?.userId?.slice(0, 8)}...</p>
                        </div>
                    </div>

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {/* Preferences Section */}
                        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50">
                                <h3 className="font-bold text-slate-900 dark:text-white">Preferences</h3>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Theme */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block">Theme</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {[
                                            { value: 'light', icon: Sun, label: 'Light' },
                                            { value: 'dark', icon: Moon, label: 'Dark' },
                                            { value: 'system', icon: Monitor, label: 'System' },
                                        ].map((option) => (
                                            <label
                                                key={option.value}
                                                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${form.watch('preferences.theme') === option.value
                                                    ? 'bg-primary/5 border-primary text-primary ring-1 ring-primary'
                                                    : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700 hover:border-primary/50 text-slate-600 dark:text-slate-400'
                                                    }`}
                                            >
                                                <input
                                                    type="radio"
                                                    value={option.value}
                                                    {...form.register('preferences.theme')}
                                                    className="sr-only"
                                                />
                                                <option.icon size={20} />
                                                <span className="text-xs font-medium">{option.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Language */}
                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block flex items-center gap-2">
                                        <Globe size={16} /> Language
                                    </label>
                                    <select
                                        {...form.register('preferences.language')}
                                        className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
                                    >
                                        <option value="th">ภาษาไทย (Thai)</option>
                                        <option value="en">English (Coming Soon)</option>
                                    </select>
                                </div>

                                {/* Notifications */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
                                            <Bell size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">Notifications</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">Receive updates via LINE</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            {...form.register('preferences.notifications')}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/30 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Integrations Section */}
                        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50">
                                <h3 className="font-bold text-slate-900 dark:text-white">Integrations</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">Google Calendar</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {data?.google_email ? `Connected as ${data.google_email}` : 'Sync tasks with your calendar'}
                                            </p>
                                        </div>
                                    </div>
                                    {data?.google_email ? (
                                        <button
                                            type="button"
                                            onClick={() => toast.error('Disconnect feature coming soon!')}
                                            className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (liffProfile?.userId) {
                                                    window.location.href = `/api/auth/google?userId=${liffProfile.userId}`;
                                                } else {
                                                    toast.error('User ID not found');
                                                }
                                            }}
                                            className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={20} />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </DataStateHandler>
    );
}
