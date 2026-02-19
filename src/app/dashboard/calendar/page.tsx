'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { ChevronLeft, Calendar as CalendarIcon, AlertCircle, CheckCircle, ExternalLink, MapPin, Clock } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLiff } from '@/components/providers/LiffProvider';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { Skeleton, EmptyState, ErrorState, FullPageLoader } from '@/components/ui/States';
import { toast } from 'react-hot-toast';

interface CalendarEvent {
    id: string;
    summary: string;
    start: string;
    end: string;
    link?: string;
    location?: string;
}

function CalendarContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { profile } = useLiff();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Handle OAuth Callback Params
    useEffect(() => {
        const error = searchParams.get('error');
        const success = searchParams.get('success');

        if (error) {
            toast.error('Google Calendar Connect Failed');
            router.replace('/dashboard/calendar');
        }
        if (success) {
            toast.success('Google Calendar Connected!');
            router.replace('/dashboard/calendar');
        }
    }, [searchParams, router]);

    useEffect(() => {
        if (profile?.userId) {
            fetchEvents(profile.userId);
        }
    }, [profile]);

    async function fetchEvents(userId: string) {
        try {
            setLoading(true);
            setFetchError(null);

            const res = await fetch(`/api/calendar/events?lineUserId=${userId}`);

            if (res.status === 401) {
                setIsConnected(false);
                setLoading(false);
                return;
            }

            if (!res.ok) throw new Error('Fetch Failed');

            const json = await res.json();
            setEvents(json.data || []);
            setIsConnected(true);
        } catch (error) {
            setFetchError('ไม่สามารถโหลดข้อมูลปฏิทินได้');
        } finally {
            setLoading(false);
        }
    }

    const handleConnect = () => {
        if (!profile?.userId) return;
        window.location.href = `/api/auth/google/login?userId=${profile.userId}`;
    };

    return (
        <div className="min-h-screen bg-background-light dark:bg-zinc-950 p-6 pb-24">
            <header className="flex items-center justify-between mb-6 sticky top-0 bg-background-light dark:bg-zinc-950 z-10 py-2">
                <div className="flex items-center">
                    <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                        <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">Smart Calendar</h1>
                </div>
                {isConnected && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Synced
                    </span>
                )}
            </header>

            {!isConnected && !loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-500">
                    <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
                        <CalendarIcon size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">Connect Google Calendar</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-xs mb-8 leading-relaxed">
                        เชื่อมต่อปฏิทินของคุณเพื่อดูตารางนัดหมายและจัดการเวลาได้ดียิ่งขึ้น
                    </p>
                    <button
                        onClick={handleConnect}
                        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-zinc-700 transition-all font-medium text-slate-700 dark:text-white"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        <span>Sign in with Google</span>
                    </button>
                </div>
            ) : (
                <DataStateHandler
                    isLoading={loading}
                    error={fetchError}
                    data={events}
                    isEmpty={events.length === 0}
                    loadingSkeleton={
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 animate-pulse">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-zinc-700 flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-zinc-700 rounded" />
                                        <div className="h-3 w-1/3 bg-slate-50 dark:bg-zinc-800 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                    emptyState={
                        <EmptyState
                            title="ไม่มีนัดหมายเร็วๆ นี้"
                            description="ตารางของคุณว่างเปล่าสำหรับ 7 วันข้างหน้า"
                            icon={<CalendarIcon size={32} />}
                        />
                    }
                    onRetry={() => profile?.userId && fetchEvents(profile.userId)}
                >
                    {(data) => (
                        <div className="space-y-4">
                            {/* Group by Date Logic could go here, strictly linear for now */}
                            {data.map((event) => {
                                const startDate = new Date(event.start);
                                const isAllDay = event.start.includes('-') && !event.start.includes('T');

                                return (
                                    <a
                                        key={event.id}
                                        href={event.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block bg-white dark:bg-zinc-800 rounded-xl p-4 border border-slate-100 dark:border-zinc-700 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                                    >
                                        <div className="flex items-start gap-4">
                                            {/* Date Box */}
                                            <div className="flex flex-col items-center justify-center w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                                                <span className="text-xs font-bold uppercase">{startDate.toLocaleDateString('en', { month: 'short' })}</span>
                                                <span className="text-lg font-bold leading-none">{startDate.getDate()}</span>
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2">{event.summary}</h3>
                                                <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                    <div className="flex items-center gap-1">
                                                        <Clock size={12} />
                                                        <span>
                                                            {isAllDay ? 'All Day' : startDate.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    {event.location && (
                                                        <div className="flex items-center gap-1 truncate">
                                                            <MapPin size={12} />
                                                            <span className="truncate max-w-[120px]">{event.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {event.link && (
                                                <ExternalLink size={16} className="text-slate-300 dark:text-slate-600 flex-shrink-0 mt-1" />
                                            )}
                                        </div>
                                    </a>
                                );
                            })}

                            <div className="text-center pt-8 pb-4">
                                <p className="text-xs text-slate-400">Showing events for the next 7 days</p>
                            </div>
                        </div>
                    )}
                </DataStateHandler>
            )}
        </div>
    );
}

export default function CalendarPage() {
    return (
        <Suspense fallback={<FullPageLoader />}>
            <CalendarContent />
        </Suspense>
    );
}
