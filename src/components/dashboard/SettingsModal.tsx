import React, { useState } from 'react';
import { X, Crown, CreditCard, Check, User } from 'lucide-react';
import { useLiff } from '@/components/providers/LiffProvider';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    membership: string;
}

export function SettingsModal({ isOpen, onClose, membership }: SettingsModalProps) {
    const { profile } = useLiff();
    const [isLoading, setIsLoading] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setCheckoutError(null);
        onClose();
    };

    const handleUpgrade = async () => {
        setIsLoading(true);
        setCheckoutError(null);
        try {
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: profile?.userId,
                    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID
                }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                setCheckoutError(data.error || 'ไม่สามารถเริ่มการชำระเงินได้ กรุณาลองใหม่');
            }
        } catch {
            setCheckoutError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <SettingsIcon /> Settings
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors text-slate-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto">

                    {/* Profile Section */}
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-zinc-800 overflow-hidden border-2 border-white dark:border-zinc-700 shadow-md">
                            {profile?.pictureUrl ? (
                                <img src={profile.pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <User size={32} />
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white">{profile?.displayName || 'Guest'}</h4>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-slate-400 uppercase tracking-wide">
                                {membership} Plan
                            </span>
                        </div>
                    </div>

                    {/* Subscription Card */}
                    {membership === 'free' ? (
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl p-6 text-white text-center shadow-lg shadow-indigo-500/30">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <Crown size={24} className="text-white" />
                            </div>
                            <h5 className="text-xl font-bold mb-2">Upgrade to Pro</h5>
                            <p className="text-indigo-100 text-sm mb-6">
                                Unlock unlimited tasks, priority AI response, and exclusive features.
                            </p>

                            <button
                                onClick={handleUpgrade}
                                disabled={isLoading}
                                className="w-full py-3 px-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard size={18} />
                                        Secure Checkout
                                    </>
                                )}
                            </button>
                            {checkoutError && (
                                <p className="mt-3 text-sm text-red-300 text-center">{checkoutError}</p>
                            )}
                        </div>
                    ) : (
                        <div className="bg-emerald-600 rounded-xl p-6 text-white text-center shadow-lg">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                                <Check size={24} className="text-white" />
                            </div>
                            <h5 className="text-xl font-bold mb-2">You are a Pro Member</h5>
                            <p className="text-emerald-100 text-sm">
                                Thank you for supporting Kinn!
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function SettingsIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
    )
}
