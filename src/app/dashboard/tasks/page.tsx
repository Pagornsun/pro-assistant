'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/components/providers/LiffProvider';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { Skeleton, EmptyState } from '@/components/ui/States';
import { Task } from '@/lib/types';
import { TaskSearch } from '@/components/dashboard/TaskSearch';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { DeleteTaskButton } from '@/components/dashboard/DeleteTaskButton';
import { TaskCard } from '@/components/dashboard/TaskCard';

export default function TasksPage() {
    const router = useRouter();
    const { profile } = useLiff();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [searchParams, setSearchParams] = useState({ query: '', status: 'all' });
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Optimistic update
    const handleTaskSaved = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    useEffect(() => {
        if (profile?.userId) {
            fetchTasks(profile.userId, searchParams.query, searchParams.status);
        }
    }, [profile, searchParams]);

    async function fetchTasks(userId: string, query: string, status: string) {
        try {
            setLoading(true);
            setFetchError(null);

            const params = new URLSearchParams({
                lineUserId: userId,
                limit: '50',
            });

            if (query) params.append('search', query);
            if (status && status !== 'all') params.append('status', status);

            const res = await fetch(`/api/tasks?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch tasks');

            const json = await res.json();
            const data = json.data?.tasks || json.tasks || [];

            setTasks(data);
        } catch (error) {
            console.error('Fetch error:', error);
            setFetchError('ไม่สามารถโหลดข้อมูลงานได้ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setLoading(false);
        }
    }

    const handleSearch = (query: string, status: string) => {
        setSearchParams({ query, status });
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">All Tasks</h1>
            </header>

            <TaskSearch onSearch={handleSearch} />

            <DataStateHandler
                isLoading={loading && tasks.length === 0}
                error={fetchError}
                data={tasks}
                isEmpty={tasks.length === 0}
                loadingSkeleton={
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} />)}
                    </div>
                }
                emptyState={
                    <EmptyState
                        icon={<Clock size={32} className="opacity-50" />}
                        title="ไม่พบงาน"
                        description="ลองค้นหาด้วยคำอื่น หรือสร้างงานใหม่เพื่อให้ Kinn ช่วยจัดการ"
                    />
                }
                onRetry={() => profile?.userId && fetchTasks(profile.userId, searchParams.query, searchParams.status)}
            >
                {(data) => (
                    <div className="flex flex-col gap-3 animate-in fade-in duration-500">
                        {data.map(task => (
                            <TaskCard
                                key={task.id}
                                task={task}
                                lineUserId={profile?.userId || ''}
                                onClick={() => router.push(`/dashboard/tasks/${task.id}`)}
                                onDelete={() => handleTaskDeleted(task.id)}
                            />
                        ))}
                    </div>
                )}
            </DataStateHandler>

            <EditTaskModal
                task={selectedTask}
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                onSaved={handleTaskSaved}
                lineUserId={profile?.userId || ''}
            />
        </div>
    );
}
