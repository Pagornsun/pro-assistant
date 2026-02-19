"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";

const adminLoginSchema = z.object({
    email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
    password: z.string().min(8, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
});

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
    const router = useRouter();

    // Validate a single field on blur
    const validateField = (field: 'email' | 'password', value: string) => {
        const result = adminLoginSchema.shape[field].safeParse(value);
        setFieldErrors(prev => ({
            ...prev,
            [field]: result.success ? undefined : result.error.issues[0].message,
        }));
    };

    const isFormValid = !fieldErrors.email && !fieldErrors.password && email.length > 0 && password.length > 0;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // Full validation before submit
        const result = adminLoginSchema.safeParse({ email, password });
        if (!result.success) {
            const issues = result.error.flatten().fieldErrors;
            setFieldErrors({
                email: issues.email?.[0],
                password: issues.password?.[0],
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            router.push("/admin/dashboard");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="dark min-h-screen bg-background-light dark:bg-background-dark flex flex-col items-center justify-center p-6 font-manrope">
            <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-3xl shadow-2xl p-10 border border-slate-100 dark:border-white/5 relative overflow-hidden">
                {/* Decorative element */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>

                <div className="text-center mb-10 relative z-10">
                    <h1 className="text-4xl font-extrabold text-primary mb-3">Kinn.</h1>
                    <p className="text-text-secondary font-bold text-xs uppercase tracking-widest">Admin Access</p>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 text-red-400 rounded-2xl text-xs font-bold border border-red-500/20 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6 relative z-10">
                    <div>
                        <label htmlFor="email" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            <input
                                id="email"
                                type="email"
                                required
                                className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-background-light dark:bg-background-dark border focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm font-bold dark:text-white ${fieldErrors.email ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-primary/50'
                                    }`}
                                placeholder="admin@kinn.ai"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={(e) => validateField('email', e.target.value)}
                            />
                        </div>
                        {fieldErrors.email && (
                            <p className="mt-1.5 ml-1 text-xs text-red-400 font-semibold">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2 ml-1">
                            Password
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" />
                            <input
                                id="password"
                                type="password"
                                required
                                className={`w-full pl-12 pr-4 py-4 rounded-2xl bg-background-light dark:bg-background-dark border focus:ring-4 focus:ring-primary/10 transition-all outline-none text-sm font-bold dark:text-white ${fieldErrors.password ? 'border-red-400 focus:border-red-400' : 'border-transparent focus:border-primary/50'
                                    }`}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onBlur={(e) => validateField('password', e.target.value)}
                            />
                        </div>
                        {fieldErrors.password && (
                            <p className="mt-1.5 ml-1 text-xs text-red-400 font-semibold">{fieldErrors.password}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-primary text-white font-bold rounded-2xl hover:bg-primary-dark transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/20 disabled:opacity-50 text-sm mt-4"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Authorize Entry"}
                    </button>
                </form>

                <div className="mt-10 text-center text-[10px] font-bold text-text-secondary uppercase tracking-widest relative z-10">
                    Secure Administrative Portal
                </div>
            </div>
        </div>
    );
}
