"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    ExternalLink,
    LogOut,
    RefreshCcw,
    Search,
    Bell,
    TrendingUp,
    Users,
    Filter,
    MessageSquare,
    Plane,
    Gift,
    LayoutDashboard,
    BarChart3,
    Settings,
    Inbox
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'done' | 'cancelled';
    result_link: string | null;
    created_at: string;
    profiles: {
        line_user_id: string;
    };
}

export default function AdminDashboard() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [resultLink, setResultLink] = useState("");
    const router = useRouter();

    useEffect(() => {
        fetchTasks();

        const channel = supabase
            .channel('tasks-channel')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks' },
                () => {
                    fetchTasks();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchTasks = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select(`
        *,
        profiles (line_user_id)
      `)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTasks(data as any);
        }
        setLoading(false);
    };

    const updateStatus = async (taskId: string, newStatus: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ status: newStatus })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
        }
    };

    const saveResultLink = async (taskId: string) => {
        const { error } = await supabase
            .from('tasks')
            .update({ result_link: resultLink, status: 'done' })
            .eq('id', taskId);

        if (!error) {
            setTasks(tasks.map(t => t.id === taskId ? { ...t, result_link: resultLink, status: 'done' } : t));
            setEditingId(null);
            setResultLink("");
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/admin/login");
    };

    const getTimeAgo = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffInMins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

        if (diffInMins < 1) return 'now';
        if (diffInMins < 60) return `${diffInMins}m ago`;
        const diffInHours = Math.floor(diffInMins / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-white min-h-screen flex flex-col font-manrope">
            {/* Header */}
            <header className="flex-none px-6 py-5 flex items-center justify-between z-20">
                <div>
                    <h2 className="text-xl font-bold tracking-tight">Admin Overview</h2>
                    <p className="text-xs font-medium text-text-secondary">Kinn Platform • v1.0.0</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="relative p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <Bell className="w-5 h-5 text-slate-700 dark:text-white" />
                        <span className="absolute top-2 right-2.5 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 border border-background-light dark:border-background-dark"></span>
                        </span>
                    </button>
                    <button onClick={handleLogout} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <LogOut className="w-5 h-5 text-slate-700 dark:text-white" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto no-scrollbar pb-24">
                <div className="px-6 flex flex-col gap-6">
                    {/* Stats Row (Horizontal Scroll) */}
                    <section className="w-full overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                        <div className="flex gap-4 w-max">
                            {/* Stat Card 1 */}
                            <div className="flex flex-col justify-between w-[160px] h-[140px] p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5">
                                <div className="flex items-start justify-between">
                                    <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </span>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp className="w-3 h-3" /> 12%
                                    </div>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold dark:text-white">{tasks.length}</p>
                                    <p className="text-xs font-medium text-text-secondary mt-1">Total Tasks</p>
                                </div>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="flex flex-col justify-between w-[160px] h-[140px] p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5">
                                <div className="flex items-start justify-between">
                                    <span className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Users className="w-5 h-5" />
                                    </span>
                                    <span className="text-[10px] font-bold text-white bg-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Premium</span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold dark:text-white">-</p>
                                    <p className="text-xs font-medium text-text-secondary mt-1">Active Subs</p>
                                </div>
                            </div>

                            {/* Stat Card 3 */}
                            <div className="flex flex-col justify-between w-[160px] h-[140px] p-4 rounded-2xl bg-white dark:bg-surface-dark shadow-sm dark:shadow-none border border-slate-200 dark:border-white/5">
                                <div className="flex items-start justify-between">
                                    <span className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                                        <Clock className="w-5 h-5" />
                                    </span>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold dark:text-white">{tasks.filter(t => t.status === 'pending').length}</p>
                                    <p className="text-xs font-medium text-text-secondary mt-1">Pending</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Task Management Section */}
                    <section className="flex flex-col gap-4">
                        <div className="flex items-center justify-between sticky top-0 bg-background-light dark:bg-background-dark z-10 py-2">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                Incoming Tasks
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                                    {tasks.filter(t => t.status === 'pending').length}
                                </span>
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="pl-8 pr-4 py-1.5 bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 rounded-lg outline-none text-xs font-medium w-32 md:w-48 transition-all focus:w-48 md:focus:w-64"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button className="text-sm font-medium text-primary flex items-center gap-1">
                                    <Filter className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Task List */}
                        <div className="flex flex-col gap-4">
                            {loading ? (
                                <div className="p-12 text-center text-text-secondary flex flex-col items-center gap-3">
                                    <RefreshCcw className="w-8 h-8 animate-spin" />
                                    <p className="font-bold">Loading tasks...</p>
                                </div>
                            ) : tasks.length === 0 ? (
                                <div className="p-12 text-center text-text-secondary">
                                    <p className="font-bold">No tasks found.</p>
                                </div>
                            ) : (
                                tasks.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map((task) => (
                                    <div key={task.id} className="p-4 rounded-xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/5 flex flex-col gap-3 shadow-sm dark:shadow-none transition-transform hover:scale-[1.01]">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-background-light dark:border-background-dark text-xs font-bold">
                                                    {task.profiles.line_user_id.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold dark:text-white">@{task.profiles.line_user_id.slice(0, 8)}</h4>
                                                    <p className="text-[10px] text-text-secondary uppercase tracking-wider font-bold">Premium Member</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-text-secondary flex items-center gap-1">
                                                <span className={`w-1.5 h-1.5 rounded-full ${task.status === 'pending' ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                                                {getTimeAgo(task.created_at)}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <h3 className="text-sm font-bold text-slate-800 dark:text-white">{task.title}</h3>
                                            <p className="text-xs text-text-secondary line-clamp-2">{task.description}</p>
                                        </div>

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold border border-blue-500/20">Task</span>
                                            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20 uppercase">AI Tagged</span>
                                            {task.status === 'done' && (
                                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 uppercase">Completed</span>
                                            )}
                                        </div>

                                        {editingId === task.id ? (
                                            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-white/5 flex flex-col gap-3">
                                                <input
                                                    type="text"
                                                    placeholder="Result link (URL)"
                                                    className="w-full text-xs p-3 bg-background-light dark:bg-background-dark border border-primary/20 rounded-xl outline-none focus:ring-2 focus:ring-primary/10"
                                                    value={resultLink}
                                                    onChange={(e) => setResultLink(e.target.value)}
                                                />
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => saveResultLink(task.id)}
                                                        className="flex-1 bg-primary text-white text-xs font-bold py-2.5 rounded-lg shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark"
                                                    >
                                                        Save & Complete
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-text-secondary text-xs font-bold px-4 py-2.5 rounded-lg"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="pt-3 mt-1 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-[10px] font-bold text-text-secondary truncate max-w-[200px]">
                                                    {task.result_link ? (
                                                        <a href={task.result_link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary underline">
                                                            <ExternalLink className="w-3 h-3" /> {task.result_link}
                                                        </a>
                                                    ) : (
                                                        <>
                                                            <MessageSquare className="w-3 h-3" />
                                                            {task.status === 'pending' ? 'Waiting for management...' : 'Processing...'}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        className="text-[10px] font-bold bg-white dark:bg-background-dark border border-slate-200 dark:border-white/5 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/10"
                                                        value={task.status}
                                                        onChange={(e) => updateStatus(task.id, e.target.value)}
                                                    >
                                                        <option value="pending">Pending</option>
                                                        <option value="processing">Processing</option>
                                                        <option value="done">Done</option>
                                                        <option value="cancelled">Cancelled</option>
                                                    </select>
                                                    <button
                                                        onClick={() => {
                                                            setEditingId(task.id);
                                                            setResultLink(task.result_link || "");
                                                        }}
                                                        className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-5 py-2 rounded-lg transition-colors shadow-lg shadow-primary/20"
                                                    >
                                                        Manage
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Bottom Navigation */}
            <nav className="flex-none bg-white dark:bg-surface-dark border-t border-slate-200 dark:border-white/5 px-6 pb-6 pt-2 z-30">
                <div className="w-full flex justify-center pb-4">
                    <div className="w-12 h-1 rounded-full bg-slate-200 dark:bg-white/10"></div>
                </div>
                <div className="flex justify-between items-center">
                    <button className="flex flex-col items-center gap-1">
                        <div className="p-2 rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
                            <Inbox className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-bold text-primary">Tasks</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                            <Users className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium text-text-secondary group-hover:text-white transition-colors">Users</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                            <BarChart3 className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium text-text-secondary group-hover:text-white transition-colors">Stats</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 group">
                        <div className="p-2 rounded-xl text-text-secondary hover:text-white hover:bg-white/5 transition-colors">
                            <Settings className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-medium text-text-secondary group-hover:text-white transition-colors">Settings</span>
                    </button>
                </div>
            </nav>
        </div>
    );
}
