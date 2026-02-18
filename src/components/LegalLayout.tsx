import Link from 'next/link';
import { ReactNode } from 'react';

interface LegalLayoutProps {
    title: string;
    lastUpdated: string;
    children: ReactNode;
}

export function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-[#f6f6f8] flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
                <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
                    <Link href="/" className="text-xl font-extrabold text-[#3463ef] tracking-tight">
                        Kinn
                    </Link>
                    <span className="text-slate-300">|</span>
                    <span className="text-slate-600 text-sm font-medium">{title}</span>
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-10">
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{title}</h1>
                <p className="text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
                    อัปเดตล่าสุด: {lastUpdated}
                </p>
                <div className="prose prose-slate max-w-none space-y-8 text-slate-700 leading-relaxed">
                    {children}
                </div>
            </main>

            {/* Footer */}
            <Footer />
        </div>
    );
}

export function Footer() {
    return (
        <footer className="bg-white border-t border-slate-100 mt-auto">
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <span className="text-xl font-extrabold text-[#3463ef]">Kinn</span>
                    <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                        <Link href="/privacy" className="hover:text-[#3463ef] transition-colors">
                            นโยบายความเป็นส่วนตัว
                        </Link>
                        <Link href="/terms" className="hover:text-[#3463ef] transition-colors">
                            ข้อกำหนดการให้บริการ
                        </Link>
                        <Link href="/" className="hover:text-[#3463ef] transition-colors">
                            หน้าหลัก
                        </Link>
                    </nav>
                    <p className="text-xs text-slate-400">© 2026 Kinn. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
