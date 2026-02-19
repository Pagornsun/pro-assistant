'use client';

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface UseApiStateOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
    successMessage?: string;
}

/**
 * useApiState — generic hook for managing API request states.
 * Includes standardized error handling and toast notifications.
 */
export function useApiState<T>(options?: UseApiStateOptions<T>) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const [data, setData] = useState<T | null>(null);

    const execute = useCallback(async (apiCall: () => Promise<T>) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await apiCall();
            setData(result);

            if (options?.successMessage) {
                toast.success(options.successMessage);
            }

            options?.onSuccess?.(result);
            return result;
        } catch (err: unknown) {
            setError(err);
            handleApiError(err);
            options?.onError?.(err);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    const reset = useCallback(() => {
        setIsLoading(false);
        setError(null);
        setData(null);
    }, []);

    return { isLoading, error, data, execute, reset, setData };
}

/**
 * Centralized error handler for API calls.
 * Maps status codes to user-friendly Thai messages as per ui_states_design_guide.md.
 */
function handleApiError(error: unknown) {
    const apiError = error as { status?: number; response?: { status?: number }; message?: string };
    const status = apiError.status || apiError.response?.status;
    const message = apiError.message || 'เกิดข้อผิดพลาด';

    switch (status) {
        case 401:
            toast.error('ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบอีกครั้ง');
            // Potential redirect: window.location.href = '/login';
            break;
        case 403:
            toast.error('ไม่มีสิทธิ์เข้าถึงฟีเจอร์นี้');
            break;
        case 404:
            toast.error('ไม่พบข้อมูลที่ต้องการ');
            break;
        case 429:
            toast.error('ส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่');
            break;
        case 500:
        case 503:
            toast.error('เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่ภายหลัง');
            break;
        default:
            if (typeof window !== 'undefined' && !navigator.onLine) {
                toast.error('ไม่มีการเชื่อมต่ออินเทอร์เน็ต');
            } else {
                toast.error(message);
            }
    }
}
