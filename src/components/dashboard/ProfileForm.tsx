'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateProfileSchema, type UpdateProfileInput } from '@/lib/schemas';
import { Save, Loader2, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { useLiff } from '@/components/providers/LiffProvider';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { UserProfile } from '@/lib/types';
import toast from 'react-hot-toast';

import { ProfileHeader } from './profile/ProfileHeader';
import { PreferencesForm } from './profile/PreferencesForm';
import { AccountInfo } from './profile/AccountInfo';

export function ProfileForm() {
    const { profile: liffProfile } = useLiff();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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
                        timezone: data.preferences.timezone || 'Asia/Bangkok',
                        reminder_lead_time: data.preferences.reminder_lead_time || 15,
                        briefing_daily_enabled: data.preferences.briefing_daily_enabled ?? true,
                        briefing_daily_time: data.preferences.briefing_daily_time || '08:00',
                        briefing_weekly_enabled: data.preferences.briefing_weekly_enabled ?? true,
                        briefing_weekly_time: data.preferences.briefing_weekly_time || '08:00',
                        briefing_monthly_enabled: data.preferences.briefing_monthly_enabled ?? true,
                        briefing_monthly_time: data.preferences.briefing_monthly_time || '08:00',
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
            // Refresh data to update "Last Updated"
            fetchProfile(liffProfile.userId);
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
                <div className="max-w-xl mx-auto space-y-6">
                    <ProfileHeader
                        displayName={liffProfile?.displayName || 'Guest'}
                        pictureUrl={liffProfile?.pictureUrl}
                        lineUserId={liffProfile?.userId || ''}
                        tier={data.tier}
                    />

                    <AccountInfo profile={data} />

                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <PreferencesForm form={form} />

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

                        {/* Danger Zone */}
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/30 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/30 bg-red-100/50 dark:bg-red-900/20">
                                <h3 className="font-bold text-red-900 dark:text-red-200 flex items-center gap-2">
                                    <AlertTriangle size={20} />
                                    Danger Zone
                                </h3>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                                    Once you delete your account, there is no going back. All your data including tasks and settings will be permanently removed.
                                </p>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

                                        try {
                                            setIsDeleting(true);
                                            const res = await fetch('/api/account', {
                                                method: 'DELETE',
                                                headers: { 'x-line-user-id': liffProfile?.userId || '' }
                                            });

                                            if (!res.ok) throw new Error('Delete failed');

                                            toast.success('Account deleted successfully');
                                            // Close window after short delay
                                            setTimeout(() => {
                                                window.close();
                                            }, 2000);
                                        } catch (err) {
                                            console.error(err);
                                            toast.error('Failed to delete account');
                                        } finally {
                                            setIsDeleting(false);
                                        }
                                    }}
                                    disabled={isDeleting}
                                    className="px-4 py-2 text-sm font-bold text-red-600 bg-white dark:bg-zinc-800 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isDeleting ? 'Deleting...' : <><Trash2 size={16} /> Delete Account</>}
                                </button>
                            </div>
                        </div>

                        {/* Submit Action */}
                        <div className="flex justify-end sticky bottom-6 z-10">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-primary-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
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
