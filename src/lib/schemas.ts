import { z } from 'zod';

// ─────────────────────────────────────────────
// Task Schemas
// ─────────────────────────────────────────────

export const createTaskSchema = z.object({
    title: z
        .string()
        .min(1, 'กรุณาระบุหัวข้องาน')
        .max(200, 'หัวข้องานต้องไม่เกิน 200 ตัวอักษร')
        .transform((v) => v.trim()),
    description: z
        .string()
        .max(1000, 'รายละเอียดต้องไม่เกิน 1,000 ตัวอักษร')
        .optional()
        .transform((v) => v?.trim() || undefined),
    due_date: z.string().datetime({ message: 'รูปแบบวันที่ไม่ถูกต้อง' }).optional().nullable(),
});

export const updateTaskSchema = z.object({
    title: z
        .string()
        .min(1, 'กรุณาระบุหัวข้องาน')
        .max(200, 'หัวข้องานต้องไม่เกิน 200 ตัวอักษร')
        .transform((v) => v.trim())
        .optional(),
    description: z
        .string()
        .max(1000, 'รายละเอียดต้องไม่เกิน 1,000 ตัวอักษร')
        .optional()
        .transform((v) => v?.trim() || undefined),
    status: z
        .enum(['pending', 'processing', 'done', 'cancelled'] as const)
        .optional(),
    due_date: z.string().datetime({ message: 'รูปแบบวันที่ไม่ถูกต้อง' }).optional().nullable(),
});

// ─────────────────────────────────────────────
// Profile Schemas
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
    preferences: z
        .object({
            theme: z.enum(['light', 'dark', 'auto']).optional(),
            language: z.enum(['th', 'en']).optional(),
            notifications: z.boolean().optional(),
        })
        .optional(),
});

// ─────────────────────────────────────────────
// Checkout Schema
// ─────────────────────────────────────────────

export const checkoutSchema = z.object({
    userId: z.string().uuid('userId ไม่ถูกต้อง'),
    priceId: z.string().min(1, 'priceId ไม่ถูกต้อง'),
});

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
