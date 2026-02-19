'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { UpdateProfileInput } from '@/lib/schemas';
import { Sun, Moon, Monitor, Globe, Bell } from 'lucide-react';

interface PreferencesFormProps {
    form: UseFormReturn<UpdateProfileInput>;
}

export function PreferencesForm({ form }: PreferencesFormProps) {
    return (
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

                {/* Timezone */}
                <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block flex items-center gap-2">
                        <Globe size={16} /> Timezone
                    </label>
                    <select
                        {...form.register('preferences.timezone')}
                        className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
                    >
                        <option value="Asia/Bangkok">(GMT+07:00) Bangkok</option>
                        <option value="Asia/Singapore">(GMT+08:00) Singapore</option>
                        <option value="Asia/Tokyo">(GMT+09:00) Tokyo</option>
                        <option value="Europe/London">(GMT+00:00) London</option>
                        <option value="America/New_York">(GMT-05:00) New York</option>
                    </select>
                </div>

                {/* Reminder Lead Time */}
                <div className="space-y-3 pt-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block flex items-center gap-2">
                        <Bell size={16} /> Reminder Lead Time
                    </label>
                    <select
                        {...form.register('preferences.reminder_lead_time', { valueAsNumber: true })}
                        className="w-full p-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-slate-900 dark:text-white"
                    >
                        <option value={5}>5 minutes before</option>
                        <option value={15}>15 minutes before (Default)</option>
                        <option value={30}>30 minutes before</option>
                        <option value={60}>1 hour before</option>
                        <option value={1440}>1 day before</option>
                    </select>
                </div>
            </div>
        </div>
    );
}
