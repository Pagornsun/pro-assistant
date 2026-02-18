'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import liff from '@line/liff';

interface LiffContextType {
    liff: typeof liff | null;
    profile: any | null;
    error: string | null;
    isLoggedIn: boolean;
}

const LiffContext = createContext<LiffContextType>({
    liff: null,
    profile: null,
    error: null,
    isLoggedIn: false,
});

export const useLiff = () => useContext(LiffContext);

export const LiffProvider = ({ children }: { children: ReactNode }) => {
    const [liffObject, setLiffObject] = useState<typeof liff | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        // MOCK MODE FOR E2E TESTING
        if (process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            console.log('⚠️ LIFF MOCK MODE ENABLED ⚠️');
            setProfile({
                userId: 'mock-user-id',
                displayName: 'Test User',
                pictureUrl: 'https://via.placeholder.com/150',
                statusMessage: 'Mocking is fun'
            });
            setIsLoggedIn(true);
            setLiffObject({
                id: 'mock-liff-id',
                ready: Promise.resolve(),
                init: () => Promise.resolve(),
                getProfile: () => Promise.resolve({ userId: 'mock-user-id', displayName: 'Test User' }),
                isLoggedIn: () => true,
                getDecodedIDToken: () => ({ email: 'test@example.com' }),
                closeWindow: () => { },
                logout: () => { },
                login: () => { },
            } as any);
            return;
        }

        // Fallback to hardcoded ID if env is missing or malformed (e.g. newlines)
        const LIFF_ID = (process.env.NEXT_PUBLIC_LIFF_ID || '2009152458-0jLBmnkp').trim();

        if (!LIFF_ID) {
            console.warn('LIFF_ID is not defined in environment variables.');
            setError('LIFF_ID is missing');
            return;
        }

        liff.init({ liffId: LIFF_ID })
            .then(() => {
                setLiffObject(liff);
                if (liff.isLoggedIn()) {
                    setIsLoggedIn(true);
                    liff.getProfile()
                        .then((prof) => setProfile(prof))
                        .catch((err) => console.error('Failed to get profile:', err));
                }
            })
            .catch((err: any) => {
                console.error('LIFF Init Failed:', err);
                setError(err.toString());
            });
    }, []);

    return (
        <LiffContext.Provider value={{ liff: liffObject, profile, error, isLoggedIn }}>
            {children}
        </LiffContext.Provider>
    );
};
