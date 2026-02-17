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
    Check
} from 'lucide-react';
import { useLiff } from '@/components/providers/LiffProvider';

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

export function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
    const { liff } = useLiff();
    const [selectedCategory, setSelectedCategory] = useState<string>('custom');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleNext = async () => {
        setIsSending(true);
        try {
            if (liff && liff.isInClient()) {
                const category = CATEGORIES.find(c => c.id === selectedCategory);
                await liff.sendMessages([
                    {
                        type: 'text',
                        text: `New Task: ${category?.name}`
                    }
                ]);
                liff.closeWindow();
            } else {
                alert('This feature works best inside the LINE app.');
                // Fallback for web testing?
                console.log(`Simulated sending: New Task: ${selectedCategory}`);
                onClose();
            }
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            {/* Overlay Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 backdrop-blur-[2px] transition-opacity animate-in fade-in"
                onClick={onClose}
            ></div>

            {/* Bottom Sheet Modal */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex flex-col max-h-[90vh] bg-white dark:bg-zinc-900 rounded-t-[24px] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom duration-300 w-full max-w-md mx-auto">

                {/* Handle & Header */}
                <div className="flex flex-col items-center pt-3 pb-2 px-6 flex-shrink-0">
                    {/* Drag Handle */}
                    <div className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full mb-4"></div>

                    {/* Title Row */}
                    <div className="flex items-center justify-between w-full mb-2">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Select Category</h2>
                        <button
                            onClick={onClose}
                            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-full hover:bg-gray-50 dark:hover:bg-zinc-800"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto no-scrollbar px-5 pb-4 pt-2">
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

                                <div className={`absolute top-4 right-4 h-5 w-5 rounded-full border flex items-center justify-center transition-all
                                    ${selectedCategory === cat.id
                                        ? 'bg-primary border-primary'
                                        : 'border-gray-200 dark:border-zinc-600'
                                    }`}
                                >
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
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-white dark:bg-zinc-900 border-t border-gray-50 dark:border-zinc-800 mt-2">
                    <button
                        onClick={handleNext}
                        disabled={isSending}
                        className="w-full bg-primary hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-[0.98] flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSending ? 'Sending...' : 'Next'}
                        {!isSending && <ArrowRight size={20} className="group-hover:translate-x-0.5 transition-transform" />}
                    </button>
                </div>

                {/* Safe Area Spacer */}
                <div className="h-6 bg-white dark:bg-zinc-900 w-full"></div>
            </div>
        </>
    );
}
