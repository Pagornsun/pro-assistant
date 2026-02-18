/**
 * Unit tests for Zod validation schemas (src/lib/schemas.ts)
 * Tests: createTaskSchema, updateTaskSchema, checkoutSchema
 */

import {
    createTaskSchema,
    updateTaskSchema,
    checkoutSchema,
} from '@/lib/schemas';

// ─────────────────────────────────────────────
// createTaskSchema
// ─────────────────────────────────────────────
describe('createTaskSchema', () => {
    it('accepts a valid task with title only', () => {
        const result = createTaskSchema.safeParse({ title: 'Buy groceries' });
        expect(result.success).toBe(true);
    });

    it('accepts a task with all optional fields', () => {
        const result = createTaskSchema.safeParse({
            title: 'Doctor appointment',
            description: 'Annual checkup at 10am',
            due_date: '2026-03-01T10:00:00.000Z',
        });
        expect(result.success).toBe(true);
    });

    it('trims whitespace from title', () => {
        const result = createTaskSchema.safeParse({ title: '  Trimmed Title  ' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.title).toBe('Trimmed Title');
        }
    });

    it('rejects empty title', () => {
        const result = createTaskSchema.safeParse({ title: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toBe('กรุณาระบุหัวข้องาน');
        }
    });

    it('rejects title longer than 200 characters', () => {
        const result = createTaskSchema.safeParse({ title: 'a'.repeat(201) });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('200');
        }
    });

    it('rejects description longer than 1000 characters', () => {
        const result = createTaskSchema.safeParse({
            title: 'Valid title',
            description: 'x'.repeat(1001),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('1,000');
        }
    });

    it('rejects invalid due_date format', () => {
        const result = createTaskSchema.safeParse({
            title: 'Valid title',
            due_date: 'not-a-date',
        });
        expect(result.success).toBe(false);
    });

    it('accepts null due_date', () => {
        const result = createTaskSchema.safeParse({ title: 'Task', due_date: null });
        expect(result.success).toBe(true);
    });

    it('rejects missing title', () => {
        const result = createTaskSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// updateTaskSchema
// ─────────────────────────────────────────────
describe('updateTaskSchema', () => {
    it('accepts partial update with status only', () => {
        const result = updateTaskSchema.safeParse({ status: 'done' });
        expect(result.success).toBe(true);
    });

    it('accepts all valid status values', () => {
        const statuses = ['pending', 'processing', 'done', 'cancelled'] as const;
        statuses.forEach((status) => {
            const result = updateTaskSchema.safeParse({ status });
            expect(result.success).toBe(true);
        });
    });

    it('rejects invalid status', () => {
        const result = updateTaskSchema.safeParse({ status: 'invalid_status' });
        expect(result.success).toBe(false);
    });

    it('accepts empty object (no-op update)', () => {
        const result = updateTaskSchema.safeParse({});
        expect(result.success).toBe(true);
    });

    it('rejects title longer than 200 chars', () => {
        const result = updateTaskSchema.safeParse({ title: 'x'.repeat(201) });
        expect(result.success).toBe(false);
    });
});

// ─────────────────────────────────────────────
// checkoutSchema
// ─────────────────────────────────────────────
describe('checkoutSchema', () => {
    it('accepts valid uuid and priceId', () => {
        const result = checkoutSchema.safeParse({
            userId: '123e4567-e89b-12d3-a456-426614174000',
            priceId: 'price_1234567890',
        });
        expect(result.success).toBe(true);
    });

    it('rejects non-uuid userId', () => {
        const result = checkoutSchema.safeParse({
            userId: 'not-a-uuid',
            priceId: 'price_123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('userId');
        }
    });

    it('rejects empty priceId', () => {
        const result = checkoutSchema.safeParse({
            userId: '123e4567-e89b-12d3-a456-426614174000',
            priceId: '',
        });
        expect(result.success).toBe(false);
    });

    it('rejects missing fields', () => {
        const result = checkoutSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});
