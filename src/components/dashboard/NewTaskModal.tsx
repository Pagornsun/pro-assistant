'use client';

import React, { useState } from 'react';
import {
    X,
    Utensils,
    Plane,
    Briefcase,
    ShoppingBag,
    Heart,
    PlusCircle,
    ArrowRight,
    Check,
    ChevronLeft,
    Calendar,
    Clock,
    Repeat
} from 'lucide-react';
import { useLiff } from '@/components/providers/LiffProvider';
import { LoadingSpinner } from '@/components/ui/States';
import toast from 'react-hot-toast';

interface NewTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORIES = [
    { id: 'dining', name: 'Dining & Nightlife', desc: 'Reservations and recommendations.', icon: Utensils },
    { id: 'travel', name: 'Travel & Logistics', desc: 'Flight, hotel, and transport.', icon: Plane },
    { id: 'business', name: 'Business & Admin', desc: 'Document prep and scheduling.', icon: Briefcase },
    { id: 'shopping', name: 'Shopping & Gifts', desc: 'Sourcing and deliveries.', icon: ShoppingBag },
    { id: 'wellness', name: 'Wellness & Health', desc: 'Spa and medical bookings.', icon: Heart },
    { id: 'custom', name: 'Custom Request', desc: 'Anything else you need.', icon: PlusCircle },
];

import UpgradePromptModal from './UpgradePromptModal';

// ... existing imports

export function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
    const { profile } = useLiff();
    const [step, setStep] = useState<'category' | 'details'>('category');
    const [selectedCategory, setSelectedCategory] = useState<string>('custom');
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFreq, setRecurringFreq] = useState('weekly');
    const [recurringInterval, setRecurringInterval] = useState(1);

    // Tags State
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');

    const [isSending, setIsSending] = useState(false);
    const [sendError, setSendError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);

    if (!isOpen) return null;

    const resetForm = () => {
        setStep('category');
        setTitle('');
        setDescription('');
        setDueDate('');
        setIsRecurring(false);
        setRecurringFreq('weekly');
        setRecurringInterval(1);
        setTags([]);
        setTagInput('');
        setSelectedCategory('custom');
        setSendError(null);
        setTitleError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleNext = () => {
        setStep('details');
        // Auto-fill title with category name if empty
        if (!title) {
            const cat = CATEGORIES.find(c => c.id === selectedCategory);
            if (cat) setTitle(cat.name);
        }
    };

    const validate = () => {
        if (!title.trim()) {
            setTitleError('กรุณาระบุหัวข้องาน');
            return false;
        }
        if (title.trim().length > 200) {
            setTitleError('หัวข้องานต้องไม่เกิน 200 ตัวอักษร');
            return false;
        }
        setTitleError(null);
        return true;
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const val = tagInput.trim();
            if (val && !tags.includes(val)) {
                if (tags.length >= 5) {
                    toast.error('Max 5 tags allowed');
                    return;
                }
                setTags([...tags, val]);
                setTagInput('');
            }
        }
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        if (!profile?.userId) {
            setSendError('ไม่พบข้อมูลผู้ใช้ กรุณาลองใหม่');
            return;
        }

        setIsSending(true);
        setSendError(null);

        const recurring_config = isRecurring ? {
            frequency: recurringFreq,
            interval: Number(recurringInterval)
        } : null;

        try {
            const res = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-line-user-id': profile.userId,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    due_date: dueDate ? new Date(dueDate).toISOString() : null,
                    category: selectedCategory,
                    recurring_config,
                    tags
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                if (res.status === 403 && json.error === 'LIMIT_REACHED') {
                    setShowUpgradeModal(true);
                    return; // Don't close modal, show upgrade prompt
                }
                throw new Error(json.error?.message || 'Failed to create task');
            }

            toast.success('สร้างงานสำเร็จ!');
            // Refresh dashboard
            window.location.reload();
            handleClose();

        } catch (err: any) {
            setSendError(err.message || 'ส่งข้อความไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Overlay Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
                onClick={handleClose}
            ></div>

            {/* Bottom Sheet Modal */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col h-[90vh] bg-white dark:bg-zinc-900 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">

                {/* Header */}
                <div className="flex flex-col items-center pt-3 pb-2 px-6 flex-shrink-0">
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mb-4"></div>
                    <div className="flex items-center justify-between w-full mb-2">
                        <div className="flex items-center gap-2">
                            {step === 'details' && (
                                <button onClick={() => setStep('category')} className="p-1 -ml-1 rounded-full hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors">
                                    <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
                                </button>
                            )}
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                {step === 'category' ? 'Select Category' : 'Task Details'}
                            </h2>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-4 pt-2">
                    {step === 'category' ? (
                        <div className="grid grid-cols-2 gap-4">
                            {CATEGORIES.map((cat) => (
                                <label
                                    key={cat.id}
                                    className={`group relative flex flex-col p-4 bg-white dark:bg-zinc-800 border rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] cursor-pointer transition-all active:scale-[0.98]
                                    ${selectedCategory === cat.id
                                            ? 'border-primary dark:border-primary ring-1 ring-primary dark:ring-primary'
                                            : 'border-gray-100 dark:border-zinc-700 hover:border-primary/30'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="category"
                                        className="peer sr-only"
                                        checked={selectedCategory === cat.id}
                                        onChange={() => setSelectedCategory(cat.id)}
                                    />
                                    <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border flex items-center justify-center transition-all ${selectedCategory === cat.id ? 'bg-primary border-primary' : 'border-gray-200 dark:border-zinc-600'}`}>
                                        <Check size={14} className={`text-white transition-opacity ${selectedCategory === cat.id ? 'opacity-100' : 'opacity-0'}`} />
                                    </div>
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3 group-hover:bg-primary/20 transition-colors">
                                        <cat.icon size={24} />
                                    </div>
                                    <h3 className="text-gray-900 dark:text-white font-bold text-sm mb-1 leading-tight">{cat.name}</h3>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{cat.desc}</p>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Subject <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={title}
                                    data-testid="task-title-input"
                                    onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
                                    className={`w-full px-4 py-3 rounded-xl border bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${titleError ? 'border-red-400' : 'border-slate-200 dark:border-zinc-700'}`}
                                    placeholder="What do you need done?"
                                />
                                {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Details</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                                    placeholder="Add any specific instructions..."
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                                    <Clock size={16} /> Due Date
                                </label>
                                <input
                                    type="datetime-local"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                                />
                                <p className="text-xs text-slate-500 mt-1 ml-1">We'll remind you 15 minutes before.</p>
                            </div>

                            {/* Recurring Task */}
                            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                        <Repeat size={16} className={isRecurring ? "text-primary" : "text-slate-400"} />
                                        Recurring Task
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setIsRecurring(!isRecurring)}
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isRecurring ? 'bg-primary' : 'bg-slate-200 dark:bg-zinc-700'}`}
                                    >
                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isRecurring ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </button>
                                </div>

                                {isRecurring && (
                                    <div className="grid grid-cols-2 gap-3 mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Frequency</label>
                                            <select
                                                value={recurringFreq}
                                                onChange={(e) => setRecurringFreq(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            >
                                                <option value="daily">Daily</option>
                                                <option value="weekly">Weekly</option>
                                                <option value="monthly">Monthly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-500 mb-1 block">Interval</label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400">Every</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="99"
                                                    value={recurringInterval}
                                                    onChange={(e) => setRecurringInterval(Number(e.target.value))}
                                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-center"
                                                />
                                                <span className="text-xs text-slate-400">
                                                    {recurringFreq === 'daily' ? 'days' : recurringFreq === 'weekly' ? 'weeks' : 'months'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Tags Section */}
                            <div className="border-t border-slate-100 dark:border-zinc-800 pt-4">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                                    Tags <span className="text-xs font-normal text-slate-400">(Optional)</span>
                                </label>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {tags.map(tag => (
                                        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                                            #{tag}
                                            <button
                                                onClick={() => removeTag(tag)}
                                                className="hover:text-blue-800 dark:hover:text-blue-200"
                                            >
                                                <X size={12} />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={tagInput}
                                    onChange={(e) => setTagInput(e.target.value)}
                                    onKeyDown={handleTagKeyDown}
                                    placeholder="Add a tag..."
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                                />
                                <p className="text-xs text-slate-400 mt-1 ml-1">Current tags: {tags.length > 0 ? tags.join(', ') : 'None'}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-50 dark:border-zinc-800 mt-auto">
                    {step === 'category' ? (
                        <button
                            onClick={handleNext}
                            data-testid="task-next-btn"
                            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group"
                        >
                            Next <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={isSending}
                            data-testid="task-submit-btn"
                            className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSending ? (
                                <><LoadingSpinner size="sm" className="border-white border-t-transparent" /> Creating...</>
                            ) : (
                                <>Create Task <Check size={20} /></>
                            )}
                        </button>
                    )}
                    {sendError && (
                        <p className="mt-3 text-sm text-center text-amber-600 dark:text-amber-400">{sendError}</p>
                    )}
                </div>

                <div className="h-6 bg-white dark:bg-zinc-900 w-full flex-shrink-0"></div>
            </div>

            <UpgradePromptModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
            />
        </>
    );
}
