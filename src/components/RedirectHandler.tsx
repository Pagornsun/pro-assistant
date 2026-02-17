'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function RedirectHandler() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const redirectPath = searchParams.get('redirect');
        if (redirectPath) {
            console.log('Redirecting to:', redirectPath);
            router.push(redirectPath);
        }
    }, [searchParams, router]);

    return null;
}
