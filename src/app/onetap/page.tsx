'use client';

import { useEffect, useState } from 'react';
import { useLiff } from '@/components/providers/LiffProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function OneTapPage() {
    const { isLoggedIn, liff, error: liffError } = useLiff();
    const router = useRouter();
    const [status, setStatus] = useState('Initializing...');

    useEffect(() => {
        const init = async () => {
            if (liffError) {
                setStatus('Error: ' + liffError);
                return;
            }

            if (!liff) return;

            if (!isLoggedIn) {
                setStatus('Logging in...');
                liff.login({ redirectUri: typeof window !== 'undefined' ? window.location.href : undefined });
                return;
            }

            try {
                setStatus('Syncing Profile...');
                const profile = await liff.getProfile();

                const res = await fetch('/api/auth/sync', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lineUserId: profile.userId,
                        displayName: profile.displayName,
                        pictureUrl: profile.pictureUrl
                    })
                });

                if (!res.ok) throw new Error('Sync failed');

                const data = await res.json();
                const userProfile = data.profile;

                if (userProfile.tutorial_step < 99) {
                    setStatus('Redirecting to Tutorial...');
                    // In future, redirect to specific tutorial page. 
                    // For now, go to dashboard but show a "Welcome" toast maybe?
                    router.replace('/dashboard?welcome=true');
                } else {
                    setStatus('Redirecting...');
                    router.replace('/dashboard');
                }

            } catch (err) {
                console.error(err);
                setStatus('Login Failed. Please try again.');
            }
        };

        init();
    }, [liff, isLoggedIn, liffError, router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-gray-900 text-charcoal dark:text-white p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <h1 className="text-xl font-bold mb-2">Welcome to Kinn</h1>
            <p className="text-gray-500">{status}</p>
        </div>
    );
}
