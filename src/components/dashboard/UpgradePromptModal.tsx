"use client";

import { X, Check } from "lucide-react";
import Link from "next/link";

interface UpgradePromptModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UpgradePromptModal({ isOpen, onClose }: UpgradePromptModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-surface-dark w-full max-w-md rounded-3xl p-6 shadow-2xl relative overflow-hidden border border-amber-500/20">
                {/* Decorative & Close */}
                <div className="absolute top-0 right-0 p-4">
                    <button onClick={onClose} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-text-secondary" />
                    </button>
                </div>

                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500" />

                <div className="text-center mt-4 mb-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white dark:border-surface-dark shadow-lg">
                        <span className="text-3xl">👑</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">
                        Daily Limit Reached
                    </h2>
                    <p className="text-text-secondary text-sm px-4">
                        You&lsquo;ve reached the 10-task limit for free users. Upgrade to <span className="text-amber-500 font-bold">Pro</span> for unlimited tasks and priority support!
                    </p>
                </div>

                <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Unlimited Task Creation</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Advanced Recurring Tasks</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                        <span>Priority AI Processing</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <Link
                        href="/dashboard/subscription"
                        onClick={onClose}
                        className="block w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold rounded-xl text-center shadow-lg shadow-orange-500/20 hover:scale-[1.02] transition-transform"
                    >
                        Upgrade to Pro - ฿199/mo
                    </Link>
                    <button
                        onClick={onClose}
                        className="block w-full py-3 text-text-secondary font-bold text-sm hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}
