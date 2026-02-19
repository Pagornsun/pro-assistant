'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/components/providers/LiffProvider';
import { ChevronLeft, Calendar, Repeat, Tag, Edit2, Trash2, CheckCircle, Clock } from 'lucide-react';
import { Task } from '@/lib/types';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { Skeleton } from '@/components/ui/States';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { DeleteTaskButton } from '@/components/dashboard/DeleteTaskButton';

// Utility to format date in Thai/Local
const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'ไม่มีกำหนด';
    const date = new Date(dateString);
    return date.toLocaleString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const TaskDetailSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-3/4 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <Skeleton className="h-4 w-1/2 bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        <div className="grid grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-12 w-full bg-slate-200 dark:bg-zinc-800 rounded-lg" />
            <Skeleton className="h-12 w-full bg-slate-200 dark:bg-zinc-800 rounded-lg" />
        </div>
        <Skeleton className="h-32 w-full bg-slate-200 dark:bg-zinc-800 rounded-xl mt-6" />
    </div>
);

export default function TaskDetailPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const router = useRouter();
    const { profile } = useLiff();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    useEffect(() => {
        if (profile?.userId && params.id) {
            fetchTask(profile.userId, params.id);
        }
    }, [profile, params.id]);

    const fetchTask = async (userId: string, taskId: string) => {
        try {
            setLoading(true);
            setError(null);
            // Pass lineUserId in query for GET to match our refactored API
            const res = await fetch(`/api/tasks/${taskId}?lineUserId=${userId}`, {
                headers: {
                    'x-line-user-id': userId // Redundant but safe if middleware checks headers
                }
            });

            if (!res.ok) {
                if (res.status === 404) throw new Error('ไม่พบงานที่ต้องการ');
                throw new Error('โหลดข้อมูลไม่สำเร็จ');
            }

            const json = await res.json();
            setTask(json.data);
        } catch (err: unknown) {
            console.error(err);
            setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        } finally {
            setLoading(false);
        }
    };

    const handleTaskUpdated = (updatedTask: Task) => {
        setTask(updatedTask);
        // Refresh logic could handle recurrence re-fetch if needed, but updatedTask usually suffices for display
    };

    const handleTaskDeleted = () => {
        router.push('/dashboard/tasks');
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6 flex flex-col">
            {/* Header */}
            <header className="flex items-center justify-between mb-8 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <div className="flex-1 text-center font-bold text-lg text-slate-900 dark:text-white">
                    รายละเอียดงาน
                </div>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

            <DataStateHandler
                isLoading={loading}
                error={error}
                data={task || undefined}
                isEmpty={!task}
                loadingSkeleton={<TaskDetailSkeleton />}
                onRetry={() => profile?.userId && fetchTask(profile.userId, params.id)}
            >
                {(t: Task) => (
                    <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Status Badge */}
                        <div className="mb-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ${t.status === 'done' || t.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : 'bg-primary/10 text-primary'
                                }`}>
                                {t.status === 'done' || t.status === 'completed' ? <CheckCircle size={16} /> : <Clock size={16} />}
                                {t.status === 'done' || t.status === 'completed' ? 'เสร็จสิ้น' : t.status === 'processing' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                            {t.title}
                        </h1>

                        {/* Tags */}
                        {t.tags && t.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {t.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 text-xs rounded-md flex items-center gap-1">
                                        <Tag size={12} /> {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Meta Grid */}
                        <div className="grid grid-cols-1 gap-4 mb-8">
                            {/* Due Date */}
                            <div className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-full text-primary">
                                    <Calendar size={20} />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">กำหนดส่ง</label>
                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                        {formatDate(t.due_date)}
                                    </p>
                                </div>
                            </div>

                            {/* Recurrence */}
                            {t.recurring_config && (
                                <div className="flex items-start gap-3 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm">
                                    <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-500">
                                        <Repeat size={20} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-500 dark:text-slate-400 block mb-0.5">ทำซ้ำ</label>
                                        <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                                            {t.recurring_config.frequency} (ทุก {t.recurring_config.interval} {t.recurring_config.frequency === 'daily' ? 'วัน' : t.recurring_config.frequency === 'weekly' ? 'สัปดาห์' : 'เดือน'})
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description */}
                        {t.description && (
                            <div className="mb-8 p-4 bg-slate-50 dark:bg-zinc-900/50 rounded-xl">
                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-2 uppercase tracking-wide">รายละเอียด</label>
                                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {t.description}
                                </p>
                            </div>
                        )}

                        <div className="mt-auto" />

                        {/* Actions Footer */}
                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                onClick={() => setIsEditModalOpen(true)}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-slate-100 dark:bg-zinc-800 text-slate-800 dark:text-white rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors"
                            >
                                <Edit2 size={18} />
                                แก้ไข
                            </button>

                            <div className="w-full">
                                <DeleteTaskButton
                                    taskId={t.id}
                                    taskTitle={t.title}
                                    lineUserId={profile?.userId || ''}
                                    onDeleted={handleTaskDeleted}
                                >
                                    <button className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                        <Trash2 size={18} />
                                        ลบงาน
                                    </button>
                                </DeleteTaskButton>
                            </div>
                        </div>
                    </div>
                )}
            </DataStateHandler>

            <EditTaskModal
                task={task}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSaved={handleTaskUpdated}
                lineUserId={profile?.userId || ''}
            />
        </div>
    );
}
