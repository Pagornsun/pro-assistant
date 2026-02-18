'use client';

import React from 'react';
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineBanner } from "@/components/ui/States";
import { LiffProvider } from "@/components/providers/LiffProvider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ErrorBoundary>
            <OfflineBanner />
            <LiffProvider>
                {children}
            </LiffProvider>
        </ErrorBoundary>
    );
}
