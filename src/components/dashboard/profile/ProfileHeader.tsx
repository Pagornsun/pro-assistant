'use client';

import React from 'react';
import { User } from 'lucide-react';
import { UserProfile } from '@/lib/types';

interface ProfileHeaderProps {
    displayName: string;
    pictureUrl?: string;
    lineUserId: string;
    tier: UserProfile['tier'];
}

export function ProfileHeader({ displayName, pictureUrl, lineUserId, tier }: ProfileHeaderProps) {
    return (
        <div className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden shrink-0">
                {pictureUrl ? (
                    <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <User size={32} />
                    </div>
                )}
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{displayName || 'Guest'}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${tier === 'pro'
                        ? 'bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}>
                    {tier || 'Free'} Plan
                </span>
                <p className="text-xs text-slate-400 mt-1">LINE ID: {lineUserId?.slice(0, 8)}...</p>
            </div>
        </div>
    );
}
