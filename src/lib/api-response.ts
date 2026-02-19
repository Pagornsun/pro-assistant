import { NextResponse } from 'next/server';
import { ZodError, ZodIssue } from 'zod';

// ─────────────────────────────────────────────
// Standard API Response Helpers
// ─────────────────────────────────────────────

export function apiSuccess<T>(data: T, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

export function apiError(
    code: string,
    message: string,
    status: number,
    fields?: Record<string, string>
) {
    return NextResponse.json(
        { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
        { status }
    );
}

// ─────────────────────────────────────────────
// Validation Error Handler
// ─────────────────────────────────────────────

export function handleZodError(error: ZodError) {
    const fields: Record<string, string> = {};
    error.issues.forEach((e: ZodIssue) => {
        const key = e.path.join('.');
        fields[key] = e.message;
    });
    return apiError('VALIDATION_ERROR', 'ข้อมูลไม่ถูกต้อง', 422, fields);
}

// ─────────────────────────────────────────────
// Common Error Responses
// ─────────────────────────────────────────────

export const errors = {
    unauthorized: () => apiError('UNAUTHORIZED', 'กรุณาเข้าสู่ระบบ', 401),
    forbidden: (message = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้') => apiError('FORBIDDEN', message, 403),
    notFound: (resource = 'ข้อมูล') => apiError('NOT_FOUND', `ไม่พบ${resource}`, 404),
    conflict: (message = 'ข้อมูลซ้ำกัน') => apiError('CONFLICT', message, 409),
    tooManyRequests: () => apiError('RATE_LIMIT', 'คำขอมากเกินไป กรุณารอสักครู่', 429),
    internal: (message = 'เกิดข้อผิดพลาดภายในระบบ') => apiError('INTERNAL_ERROR', message, 500),
};
