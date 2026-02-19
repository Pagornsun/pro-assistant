'use client';

import React from 'react';
import { Calendar, UserCheck } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface AccountInfoProps {
    profile: UserProfile;
}

export function AccountInfo({ profile }: AccountInfoProps) {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-800/50">
                <h3 className="font-bold text-slate-900 dark:text-white">Account Information</h3>
            </div>

            <div className="p-6 grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-500">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Member Since</p>
                        <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                            {formatDate(profile.created_at)}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-700 flex items-center justify-center text-slate-500">
                        <UserCheck size={20} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Last Updated</p>
                        <p className="text-slate-900 dark:text-white font-medium mt-0.5">
                            {formatDate(profile.updated_at)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
