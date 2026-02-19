'use client';

import React from 'react';
import { CheckCircle, Clock } from 'lucide-react';
import { Task } from '@/lib/types';
import { DeleteTaskButton } from './DeleteTaskButton';

interface TaskCardProps {
    task: Task;
    lineUserId: string;
    onClick: () => void;
    onDelete: () => void;
}

export function TaskCard({ task, lineUserId, onClick, onDelete }: TaskCardProps) {
    const isCompleted = task.status === 'done' || task.status === 'completed';
    const isProcessing = task.status === 'processing';

    return (
        <div
            className="flex items-center p-4 bg-white dark:bg-zinc-800 rounded-xl border border-slate-100 dark:border-zinc-700 shadow-sm active:scale-[0.98] transition-transform cursor-pointer group"
            onClick={onClick}
        >
            {/* Status Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-blue-50 dark:bg-blue-900/20 text-primary'
                }`}>
                {isCompleted ? <CheckCircle size={20} /> : <Clock size={20} />}
            </div>

            {/* Content */}
            <div className="ml-4 flex-1 min-w-0">
                <h4 className="text-base font-bold text-slate-900 dark:text-white truncate">{task.title}</h4>
                <div className="flex flex-col gap-1 mt-0.5">
                    {task.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{task.description}</p>
                    )}

                    {/* Tags Display */}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                            {task.tags.map(tag => (
                                <span key={tag} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-700 text-slate-600 dark:text-slate-300">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 ml-2" onClick={e => e.stopPropagation()}>
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${isCompleted
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                    : 'bg-primary/10 text-primary'
                    }`}>
                    {isCompleted ? 'Done' : isProcessing ? 'In Progress' : 'Pending'}
                </span>
                <DeleteTaskButton
                    taskId={task.id}
                    taskTitle={task.title}
                    lineUserId={lineUserId}
                    onDeleted={onDelete}
                />
            </div>
        </div>
    );
}
