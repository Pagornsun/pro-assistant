'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Bell,
    Check,
    Trash2,
    Info,
    CheckCircle,
    AlertTriangle,
    XCircle,
    Gift
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Notification } from '@/lib/types';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { EmptyState } from '@/components/ui/States';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/notifications');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            const json = await res.json();
            setNotifications(json.data || []);
        } catch (err: unknown) {
            console.error(err);
            setError('Could not load notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        try {
            // Optimistic update
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

            await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true })
            });
        } catch (err) {
            console.error(err);
            toast.error('Failed to update');
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Delete this notification?')) return;

        try {
            // Optimistic update
            setNotifications(prev => prev.filter(n => n.id !== id));

            await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
            toast.success('Deleted');
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete');
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
            case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'promotion': return <Gift className="w-5 h-5 text-purple-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 text-slate-900 dark:text-white pb-10">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 sticky top-0 z-10 bg-background-light/80 dark:bg-zinc-950/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold">Notifications</h1>
            </header>

            <main className="px-4 py-6 max-w-md mx-auto">
                <DataStateHandler
                    isLoading={loading}
                    error={error}
                    data={notifications}
                    isEmpty={notifications.length === 0}
                    emptyState={<EmptyState title="No notifications" description="You're all caught up! 🎉" />}
                    onRetry={fetchNotifications}
                >
                    {(data) => (
                        <div className="space-y-3">
                            {data.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => !n.is_read && handleMarkRead(n.id)}
                                    className={`
                                        relative group flex gap-4 p-4 rounded-xl border transition-all duration-200 cursor-pointer
                                        ${n.is_read
                                            ? 'bg-white dark:bg-zinc-900 border-transparent shadow-sm opacity-70'
                                            : 'bg-white dark:bg-zinc-800 border-primary/20 shadow-md scale-[1.01]'
                                        }
                                    `}
                                >
                                    {/* Unread Dot */}
                                    {!n.is_read && (
                                        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                                    )}

                                    <div className="shrink-0 mt-1">
                                        {getIcon(n.type)}
                                    </div>

                                    <div className="flex-1 pr-6">
                                        <h3 className={`text-sm font-bold mb-1 ${n.is_read ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                                            {n.title}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-2 line-clamp-3">
                                            {n.message}
                                        </p>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(n.created_at).toLocaleString()}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 bottom-2">
                                        <button
                                            onClick={(e) => handleDelete(n.id, e)}
                                            className="p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-500 transition"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </DataStateHandler>
            </main>
        </div>
    );
}
