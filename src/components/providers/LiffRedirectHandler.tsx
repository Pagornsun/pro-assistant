'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RedirectLogic() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const path = searchParams.get('path');
        if (path) {
            // Reconstruct the full URL with other params (like success=true)
            const params = new URLSearchParams(searchParams.toString());
            params.delete('path'); // Remove 'path' to avoid loops (though router.replace handles new path)

            const queryString = params.toString();
            const destination = queryString ? `${path}?${queryString}` : path;

            console.log('🔄 LIFF Redirect Handler: Redirecting to', destination);
            router.replace(destination);
        }
    }, [searchParams, router]);

    return null;
}

export function LiffRedirectHandler() {
    return (
        <Suspense fallback={null}>
            <RedirectLogic />
        </Suspense>
    );
}
