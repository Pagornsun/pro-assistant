'use client';

import React from 'react';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/States";
import { LiffProvider } from "@/components/providers/LiffProvider";
import { LiffRedirectHandler } from "@/components/providers/LiffRedirectHandler";
import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <Toaster
                position="bottom-center"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '12px',
                    },
                }}
            />
            <OfflineBanner />
            <LiffProvider>
                <LiffRedirectHandler />
                {children}
            </LiffProvider>
        </ErrorBoundary>
    );
}
