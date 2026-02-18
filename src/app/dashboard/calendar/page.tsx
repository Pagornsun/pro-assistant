'use client';
import React, { useEffect, useState } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiff } from '@/components/providers/LiffProvider';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { Skeleton, EmptyState } from '@/components/ui/States';

export default function CalendarPage() {
    const router = useRouter();
    const { profile } = useLiff();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (profile?.userId) {
            fetchEvents(profile.userId);
        }
    }, [profile]);

    async function fetchEvents(userId: string) {
        try {
            setLoading(true);
            setFetchError(null);
            // Simulated / Future API for Calendar
            // For now, it stays as "Coming Soon" but with standardized UI
            await new Promise(resolve => setTimeout(resolve, 1000));
            setEvents([]); // Empty for now
        } catch (error) {
            setFetchError('ไม่สามารถโหลดข้อมูลปฏิทินได้');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-6 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">Smart Calendar</h1>
            </header>

            <DataStateHandler
                isLoading={loading}
                error={fetchError}
                data={events}
                isEmpty={events.length === 0}
                loadingSkeleton={
                    <div className="space-y-6">
                        <div className="h-48 bg-white dark:bg-zinc-800 rounded-2xl border border-slate-100 dark:border-zinc-700 animate-pulse" />
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 animate-pulse">
                                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-zinc-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-zinc-700 rounded" />
                                        <div className="h-3 w-1/2 bg-slate-50 dark:bg-zinc-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                }
                emptyState={
                    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 text-primary">
                            <CalendarIcon size={40} />
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Coming Soon</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                            เรากำลังพัฒนาหน้าปฏิทินอัจฉริยะเพื่อให้คุณจัดการตารางงานได้ง่ายขึ้น เร็วๆ นี้ครับ!
                        </p>
                    </div>
                }
                onRetry={() => profile?.userId && fetchEvents(profile.userId)}
            >
                {(data) => (
                    <div className="text-center py-20">
                        {/* Event List Rendered Here */}
                    </div>
                )}
            </DataStateHandler>
        </div>
    );
}
