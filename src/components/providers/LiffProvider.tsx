'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';
import { UserProfile } from '@/lib/types';

interface LiffContextType {
    liff: typeof liff | null;
    profile: (UserProfile & { userId?: string; displayName?: string; pictureUrl?: string; statusMessage?: string }) | null;
    error: string | null;
    isLoggedIn: boolean;
}

const LiffContext = createContext<LiffContextType | undefined>(undefined);

export const useLiff = () => {
    const context = useContext(LiffContext);
    if (!context) {
        throw new Error('useLiff must be used within a LiffProvider');
    }
    return context;
};

export const LiffProvider = ({ children }: { children: ReactNode }) => {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [profile, setProfile] = useState<(UserProfile & { userId?: string; displayName?: string; pictureUrl?: string; statusMessage?: string }) | null>(() => {
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            return {
                id: 'mock-uuid',
                line_user_id: 'mock-user-id',
                tier: 'free',
                userId: 'mock-user-id',
                displayName: 'Test User',
                pictureUrl: 'https://via.placeholder.com/150',
                statusMessage: 'Mocking is fun'
            };
        }
        return null;
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(() => {
        if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            return true;
        }
        return false;
    });

    useEffect(() => {
        // MOCK MODE FOR E2E TESTING
        if (process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            console.log('⚠️ LIFF MOCK MODE ENABLED ⚠️');
            setTimeout(() => {
                const mockLiff = {
                    id: 'mock-liff-id',
                    ready: Promise.resolve(),
                    init: () => Promise.resolve(),
                    getProfile: () => Promise.resolve({
                        userId: 'mock-user-id',
                        displayName: 'Test User',
                        pictureUrl: 'https://via.placeholder.com/150',
                        statusMessage: 'Mocking is fun'
                    }),
                    isLoggedIn: () => true,
                    getDecodedIDToken: () => ({ email: 'test@example.com' }),
                    closeWindow: () => { },
                    logout: () => { },
                    login: () => { },
                } as unknown as typeof liff;
                setLiffObject(mockLiff);
                setIsLoggedIn(true);
            }, 0);
            return;
        }

        liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! })
            .then(() => {
                setLiffObject(liff);
                if (liff.isLoggedIn()) {
                    setIsLoggedIn(true);
                    liff.getProfile()
                        .then((prof: unknown) => setProfile(prof as (UserProfile & { userId?: string; displayName?: string; pictureUrl?: string; statusMessage?: string })))
                        .catch((err: unknown) => {
                            console.error('Failed to get profile:', err);
                            setError(err instanceof Error ? err.message : 'Failed to get profile');
                        });
                }
            })
            .catch((err: unknown) => {
                const liffId = process.env.NEXT_PUBLIC_LIFF_ID;
                console.error(`LIFF Init Failed (ID: ${liffId}):`, err);
                setError(`(ID: ${liffId}) ${err instanceof Error ? err.message : 'Failed to initialize LIFF'}`);
            });
    }, []);

    return (
        <LiffContext.Provider value={{ liff: liffObject, profile, error, isLoggedIn }}>
            {children}
        </LiffContext.Provider>
    );
};
