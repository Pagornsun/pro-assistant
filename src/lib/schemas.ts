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
    recurring_config: z
        .object({
            frequency: z.enum(['daily', 'weekly', 'monthly']),
            interval: z.number().min(1).max(99),
        })
        .optional()
        .nullable(),
    tags: z.array(z.string()).optional(), // ADDED
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
    recurring_config: z
        .object({
            frequency: z.enum(['daily', 'weekly', 'monthly']),
            interval: z.number().min(1).max(99),
        })
        .optional()
        .nullable(),
    tags: z.array(z.string()).optional(), // ADDED
});

// ─────────────────────────────────────────────
// Profile Schemas
// ─────────────────────────────────────────────

export const updateProfileSchema = z.object({
    preferences: z
        .object({
            theme: z.enum(['light', 'dark', 'system']).optional(),
            language: z.enum(['th', 'en']).optional(),
            notifications: z.boolean().optional(),
            timezone: z.string().optional(),
            reminder_lead_time: z.number().min(0).max(1440).optional(),
            briefing_daily_enabled: z.boolean().optional(),
            briefing_daily_time: z.string().optional(), // HH:mm
            briefing_weekly_enabled: z.boolean().optional(),
            briefing_weekly_time: z.string().optional(),
            briefing_monthly_enabled: z.boolean().optional(),
            briefing_monthly_time: z.string().optional(),
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

export const profileSchema = z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    language: z.enum(['th', 'en']).optional(),
    notifications: z.boolean().optional(),
    timezone: z.string().optional(),
    reminder_lead_time: z.number().min(0).max(1440).optional(),
    briefing_daily_enabled: z.boolean().optional(),
    briefing_daily_time: z.string().optional(),
    briefing_weekly_enabled: z.boolean().optional(),
    briefing_weekly_time: z.string().optional(),
    briefing_monthly_enabled: z.boolean().optional(),
    briefing_monthly_time: z.string().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type CheckoutInput = z.infer<typeof checkoutSchema>;
