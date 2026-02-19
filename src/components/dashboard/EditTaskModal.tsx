'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Repeat, Users, UserCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/States';
import { Task, TaskStatus } from '@/lib/types';

interface EditTaskModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: (updatedTask: Task) => void;
    lineUserId: string;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'processing', label: 'กำลังดำเนินการ' },
    { value: 'done', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
    { value: 'pending_payment', label: 'รอชำระเงิน' },
];

export function EditTaskModal({ task, isOpen, onClose, onSaved, lineUserId }: EditTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Task['status']>('pending');
    const [dueDate, setDueDate] = useState('');
    const [groupId, setGroupId] = useState<string | null>(null);
    const [assignedTo, setAssignedTo] = useState<string | null>(null);
    const [groups, setGroups] = useState<any[]>([]);

    // Recurring State
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringFreq, setRecurringFreq] = useState('weekly');
    const [recurringInterval, setRecurringInterval] = useState(1);

    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);

    // Pre-fill form when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);

            if (task.due_date) {
                const date = new Date(task.due_date);
                const localIso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
                setDueDate(localIso);
            } else {
                setDueDate('');
            }

            if (task.recurring_config) {
                const config = task.recurring_config as { frequency: string; interval: number };
                setIsRecurring(true);
                setRecurringFreq(config.frequency);
                setRecurringInterval(config.interval || 1);
            } else {
                setIsRecurring(false);
                setRecurringFreq('weekly');
                setRecurringInterval(1);
            }

            setGroupId(task.group_id || null);
            setAssignedTo(task.assigned_to || null);
            setError(null);
            setTitleError(null);
        }
    }, [task]);

    // Fetch Groups
    useEffect(() => {
        if (isOpen && lineUserId) {
            fetch(`/api/groups?lineUserId=${lineUserId}`)
                .then(res => res.json())
                .then(data => setGroups(data.groups || []))
                .catch(err => console.error('Groups fetch error:', err));
        }
    }, [isOpen, lineUserId]);

    if (!isOpen || !task) return null;

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

    const handleSave = async () => {
        if (!validate()) return;

        setIsSaving(true);
        setError(null);

        try {
            // Prepare Recurring Config with validation
            const recurring_config = isRecurring ? {
                frequency: recurringFreq,
                interval: Number(recurringInterval)
            } : null;

            const res = await fetch(`/api/tasks/${task.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'x-line-user-id': lineUserId,
                },
                body: JSON.stringify({
                    title: title.trim(),
                    description: description.trim() || undefined,
                    status,
                    due_date: dueDate ? new Date(dueDate).toISOString() : null,
                    recurring_config,
                    group_id: groupId,
                    assigned_to: assignedTo
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                // setError(json.error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
                toast.error(json.error?.message || 'บันทึกไม่สำเร็จ');
                return;
            }

            onSaved(json.data);
            onClose();
            toast.success('บันทึกงานเรียบร้อย');
        } catch {
            // setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
            toast.error('เกิดข้อผิดพลาดในการเชื่อมต่อ');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="แก้ไขงาน"
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">แก้ไขงาน</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:bg-slate-200 transition-colors"
                        aria-label="ปิด"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                    {/* Title */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            หัวข้องาน <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => { setTitle(e.target.value); setTitleError(null); }}
                            maxLength={200}
                            placeholder="ระบุหัวข้องาน"
                            className={`w-full px-4 py-3 rounded-xl border text-sm bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${titleError ? 'border-red-400' : 'border-slate-200 dark:border-zinc-700'
                                }`}
                            data-testid="edit-task-title"
                        />
                        {titleError && <p className="text-xs text-red-500 mt-1">{titleError}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            รายละเอียด
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            maxLength={1000}
                            rows={3}
                            placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                            data-testid="edit-task-description"
                        />
                    </div>

                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            กำหนดส่ง (แจ้งเตือน 15 นาทีก่อนถึง)
                        </label>
                        <input
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:light] dark:[color-scheme:dark]"
                        />
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

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                            สถานะ
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value as Task['status'])}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            data-testid="edit-task-status"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Group Assignment */}
                    <div className="border-t border-slate-100 dark:border-zinc-800 pt-4 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                                <Users size={16} /> กลุ่มที่แชร์ (Group)
                            </label>
                            <select
                                value={groupId || ''}
                                onChange={(e) => setGroupId(e.target.value || null)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                            >
                                <option value="">งานส่วนตัว (No Group)</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3" role="alert">
                            {error}
                        </p>
                    )}

                    {/* Save Button */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || !title.trim()}
                        className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        data-testid="edit-task-save"
                    >
                        {isSaving ? (
                            <><LoadingSpinner size="sm" className="border-white border-t-transparent" /> กำลังบันทึก...</>
                        ) : (
                            <><Check size={16} /> บันทึก</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
