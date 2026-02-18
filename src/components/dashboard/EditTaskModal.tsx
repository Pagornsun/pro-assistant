'use client';

import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/States';

interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'processing' | 'done' | 'cancelled';
}

interface EditTaskModalProps {
    task: Task | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: (updatedTask: Task) => void;
    lineUserId: string;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: 'รอดำเนินการ' },
    { value: 'processing', label: 'กำลังดำเนินการ' },
    { value: 'done', label: 'เสร็จสิ้น' },
    { value: 'cancelled', label: 'ยกเลิก' },
];

export function EditTaskModal({ task, isOpen, onClose, onSaved, lineUserId }: EditTaskModalProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<Task['status']>('pending');
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);

    // Pre-fill form when task changes
    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description || '');
            setStatus(task.status);
            setError(null);
            setTitleError(null);
        }
    }, [task]);

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
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                setError(json.error?.message || 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
                return;
            }

            onSaved(json.data);
            onClose();
        } catch {
            setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
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
            <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 pb-8">
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
                        <p className="text-xs text-slate-400 mt-1 text-right">{title.length}/200</p>
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
