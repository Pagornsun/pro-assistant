'use client';

import React, { useState } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '@/components/ui/States';

interface DeleteTaskButtonProps {
    taskId: string;
    taskTitle: string;
    lineUserId: string;
    onDeleted: (taskId: string) => void;
    children?: React.ReactNode;
}

export function DeleteTaskButton({ taskId, taskTitle, lineUserId, onDeleted, children }: DeleteTaskButtonProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsDeleting(true);
        // setError(null); // No need for local error state if using toast for critical errors

        try {
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'x-line-user-id': lineUserId },
            });

            if (!res.ok) {
                const json = await res.json();
                // setError(json.error?.message || 'ลบไม่สำเร็จ');
                toast.error(json.error?.message || 'ลบไม่สำเร็จ');
                return;
            }

            onDeleted(taskId);
            setShowConfirm(false);
            toast.success('ลบงานเรียบร้อยแล้ว');
        } catch {
            // setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
            toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <>
            {/* Delete trigger button */}
            {children ? (
                <div onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}>
                    {children}
                </div>
            ) : (
                <button
                    onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    aria-label={`ลบงาน: ${taskTitle}`}
                    data-testid="delete-task-btn"
                >
                    <Trash2 size={15} />
                </button>
            )}

            {/* Confirm Dialog */}
            {showConfirm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center px-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label="ยืนยันการลบ"
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => !isDeleting && setShowConfirm(false)}
                        aria-hidden="true"
                    />

                    {/* Dialog */}
                    <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle size={20} className="text-red-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white mb-1">ยืนยันการลบ</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    คุณต้องการลบงาน &ldquo;<span className="font-semibold text-slate-700 dark:text-slate-300">{taskTitle}</span>&rdquo; ใช่หรือไม่?
                                    การกระทำนี้ไม่สามารถย้อนกลับได้
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2 mb-4" role="alert">
                                {error}
                            </p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                                data-testid="delete-cancel-btn"
                            >
                                <X size={14} className="inline mr-1" />
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                data-testid="delete-confirm-btn"
                            >
                                {isDeleting ? (
                                    <><LoadingSpinner size="sm" className="border-white border-t-transparent" /> กำลังลบ...</>
                                ) : (
                                    <><Trash2 size={14} /> ลบ</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
