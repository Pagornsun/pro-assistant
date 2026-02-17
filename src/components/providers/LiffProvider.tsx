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
        const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || '';

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
