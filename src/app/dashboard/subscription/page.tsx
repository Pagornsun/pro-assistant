
'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { LoadingSpinner, ErrorState } from '@/components/ui/States';
import { CreditCard, ShieldCheck, AlertTriangle, CheckCircle, Crown, ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface SubscriptionData {
    tier: 'free' | 'pro';
    status: string;
    cancel_at_period_end?: boolean;
    current_period_end?: string;
    subscription_id?: string;
    message?: string;
}

export default function SubscriptionPage() {
    const router = useRouter();
    const { profile } = useLiff();
    const [loading, setLoading] = useState(true);
    const [subData, setSubData] = useState<SubscriptionData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        if (profile?.userId) {
            fetchSubscription(profile.userId);
        }
    }, [profile]);

    async function fetchSubscription(userId: string) {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`/api/subscription?lineUserId=${userId}`);
            if (!res.ok) throw new Error('Failed to load subscription');
            const json = await res.json();
            setSubData(json.data);
        } catch (err) {
            console.error(err);
            setError('ไม่สามารถโหลดข้อมูลสมาชิกได้');
        } finally {
            setLoading(false);
        }
    }

    async function handleCancel() {
        if (!confirm('คุณแน่ใจหรือไม่ที่จะยกเลิกการสมัครสมาชิก? คุณจะยังคงใช้งานได้จนถึงสิ้นรอบบิลปัจจุบัน')) return;

        if (!profile?.userId || !subData) return;

        try {
            setCancelling(true);
            const res = await fetch(`/api/subscription?lineUserId=${profile.userId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Cancellation failed');

            toast.success('ยกเลิกการต่ออายุอัตโนมัติเรียบร้อยแล้ว');
            fetchSubscription(profile.userId); // Refresh data
        } catch (err) {
            console.error(err);
            toast.error('เกิดข้อผิดพลาดในการยกเลิก');
        } finally {
            setCancelling(false);
        }
    }

    if (loading) return <div className="h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
    if (error) return <ErrorState message={error} onRetry={() => profile?.userId && fetchSubscription(profile.userId)} />;

    const isPro = subData?.tier === 'pro';
    const isActive = subData?.status === 'active' || subData?.status === 'trialing';
    const isCanceled = subData?.cancel_at_period_end;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 p-6">
            <header className="flex items-center mb-8">
                <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors">
                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                </button>
                <h1 className="text-xl font-bold ml-2 text-slate-900 dark:text-white">Subscription</h1>
            </header>

            <div className="max-w-md mx-auto space-y-6">
                {/* Current Plan Card */}
                <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-zinc-800 relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1.5 ${isPro ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-slate-300'}`} />

                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Current Plan</p>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                {isPro ? 'Pro Plan' : 'Free Plan'}
                                {isPro && <Crown size={20} className="text-amber-500 fill-amber-500" />}
                            </h2>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isActive
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                            {subData?.status || 'Unknown'}
                        </div>
                    </div>

                    {isPro ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <CheckCircle size={18} className="text-emerald-500" />
                                <span>Unlimited Tasks</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <CheckCircle size={18} className="text-emerald-500" />
                                <span>Priority Support</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                                <CheckCircle size={18} className="text-emerald-500" />
                                <span>Advanced Analytics</span>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-zinc-800">
                                {isCanceled ? (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg flex items-start gap-3">
                                        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Plan expires soon</p>
                                            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                                                Your subscription will end on {subData.current_period_end ? new Date(subData.current_period_end).toLocaleDateString() : 'N/A'}.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            Renews automatically on <span className="font-semibold text-slate-900 dark:text-white">{subData.current_period_end ? new Date(subData.current_period_end).toLocaleDateString() : 'N/A'}</span>
                                        </p>
                                        <button
                                            onClick={handleCancel}
                                            disabled={cancelling}
                                            className="w-full py-2.5 px-4 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors text-sm font-medium disabled:opacity-50"
                                        >
                                            {cancelling ? 'Processing...' : 'Cancel Subscription'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Upgrade directly from the Dashboard to unlock all features.
                            </p>
                            <button
                                onClick={() => router.push('/dashboard')} // Or raise a modal event
                                className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                            >
                                <Crown size={18} />
                                Upgrade Now
                            </button>
                        </div>
                    )}
                </div>

                {/* Secure Badge */}
                <div className="flex items-center justify-center gap-2 text-slate-400 text-xs">
                    <ShieldCheck size={14} />
                    <span>Secure payments powered by Stripe</span>
                </div>
            </div>
        </div>
    );
}
