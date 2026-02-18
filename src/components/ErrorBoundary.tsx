'use client';

import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('[ErrorBoundary] Caught error:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div
                    className="min-h-screen flex items-center justify-center bg-[#f6f6f8] dark:bg-zinc-950 px-6"
                    role="alert"
                >
                    <div className="max-w-sm w-full text-center">
                        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">
                            เกิดข้อผิดพลาดที่ไม่คาดคิด
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            {this.state.error?.message || 'กรุณาลองใหม่อีกครั้ง หากปัญหายังคงอยู่ ติดต่อเราผ่าน LINE'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-dark active:scale-95 transition-all text-sm"
                        >
                            ลองอีกครั้ง
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
