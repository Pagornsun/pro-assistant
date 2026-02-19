'use client';

import React, { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { supabase } from '@/lib/supabase';
import {
    Plus,
    Calendar,
    Settings,
    Headphones, // Support Agent
    Plane,      // Flight
    Utensils,   // Dinner
    Gift,       // Gift
    CheckCircle,
    Clock,
    X,
    ChevronRight,
    Crown,
    LogIn,
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

import { NewTaskModal } from '@/components/dashboard/NewTaskModal';
import { SettingsModal } from '@/components/dashboard/SettingsModal';
import { EditTaskModal } from '@/components/dashboard/EditTaskModal';
import { DeleteTaskButton } from '@/components/dashboard/DeleteTaskButton';
import { DataStateHandler } from '@/components/shared/DataStateHandler';
import { FullPageLoader, EmptyState, ErrorState, TaskCardSkeleton } from '@/components/ui/States';
import { Task } from '@/lib/types';

export default function UserDashboard() {
    const { profile, isLoggedIn, error, liff } = useLiff();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [membership, setMembership] = useState<string>('free');
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [usage, setUsage] = useState({ count: 0, limit: 5 });

    // Optimistic update: replace task in list immediately after save
    const handleTaskSaved = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    // Optimistic update: remove task from list immediately after delete
    const handleTaskDeleted = (taskId: string) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // Check query params for payment status or actions
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('payment') === 'success') {
                toast.success('Payment Successful! Welcome to Pro.', { duration: 5000 });
                // Clean up URL
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);
            }
            // Auto-open New Task Modal
            if (urlParams.get('action') === 'new-task') {
                setIsTaskModalOpen(true);
            }
        }
    }, []);

    // ... (rest of code)

    // Login Action
    const handleLogin = () => {
        if (!liff) {
            toast.error(`LIFF Init Failed: ${error || 'Unknown Error'}`);
            return;
        }
        try {
            liff.login();
        } catch (err) {
            toast.error(`Login Error: ${err}`);
        }
    };

    // ... (rest of render)

    {/* Modals */ }
            <NewTaskModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} membership={membership} />
            <EditTaskModal
                task={selectedTask}
                isOpen={isEditModalOpen}
                onClose={() => { setIsEditModalOpen(false); setSelectedTask(null); }}
                onSaved={handleTaskSaved}
                lineUserId={profile?.userId || ''}
            />
        </div >
    );
} {/* Payment Toast */ }
{
    paymentStatus === 'success' && (
        <div className="fixed bottom-6 left-6 right-6 bg-emerald-500 text-white p-4 rounded-xl shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-bottom-5">
            <CheckCircle size={20} /> Payment Successful! Welcome to Pro.
        </div>
    )
}
        </div >
    );
}
