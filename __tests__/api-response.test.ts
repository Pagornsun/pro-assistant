/**
 * @jest-environment node
 *
 * Unit tests for api-response helpers (src/lib/api-response.ts)
 * Tests: apiSuccess, apiError, handleZodError, errors shortcuts
 */

import { ZodError } from 'zod';
import { createTaskSchema } from '@/lib/schemas';
import { apiSuccess, apiError, handleZodError, errors } from '@/lib/api-response';

// Helper: extract JSON body from any NextResponse (success or error shape)
// NextResponse extends the standard Response interface, so we use Response here
// to avoid locking the type to only the success shape.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function json(response: Response): Promise<any> {
    return response.json();
}

describe('apiSuccess', () => {
    it('returns 200 with success:true and data', async () => {
        const res = apiSuccess({ id: '1', title: 'Task' });
        expect(res.status).toBe(200);
        const body = await json(res);
        expect(body.success).toBe(true);
        expect(body.data.id).toBe('1');
    });

    it('accepts custom status code', async () => {
        const res = apiSuccess({ created: true }, 201);
        expect(res.status).toBe(201);
    });
});

describe('apiError', () => {
    it('returns error response with correct structure', async () => {
        const res = apiError('NOT_FOUND', 'ไม่พบข้อมูล', 404);
        expect(res.status).toBe(404);
        const body = await json(res);
        expect(body.success).toBe(false);
        expect(body.error.code).toBe('NOT_FOUND');
        expect(body.error.message).toBe('ไม่พบข้อมูล');
    });

    it('includes fields when provided', async () => {
        const res = apiError('VALIDATION_ERROR', 'Invalid', 422, { title: 'Required' });
        const body = await json(res);
        expect(body.error.fields.title).toBe('Required');
    });

    it('does not include fields key when not provided', async () => {
        const res = apiError('UNAUTHORIZED', 'Unauthorized', 401);
        const body = await json(res);
        expect(body.error.fields).toBeUndefined();
    });
});

describe('handleZodError', () => {
    it('extracts field errors from ZodError', async () => {
        const result = createTaskSchema.safeParse({ title: '' });
        expect(result.success).toBe(false);
        if (!result.success) {
            const res = handleZodError(result.error);
            expect(res.status).toBe(422);
            const body = await json(res);
            expect(body.error.code).toBe('VALIDATION_ERROR');
            expect(body.error.fields.title).toBeDefined();
        }
    });

    it('handles multiple field errors', async () => {
        const result = createTaskSchema.safeParse({
            title: '',
            description: 'x'.repeat(1001),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
            const res = handleZodError(result.error);
            const body = await json(res);
            // Should have at least title error
            expect(Object.keys(body.error.fields).length).toBeGreaterThan(0);
        }
    });
});

describe('errors shortcuts', () => {
    it('unauthorized returns 401', async () => {
        const res = errors.unauthorized();
        expect(res.status).toBe(401);
        const body = await json(res);
        expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('forbidden returns 403', async () => {
        const res = errors.forbidden();
        expect(res.status).toBe(403);
        const body = await json(res);
        expect(body.error.code).toBe('FORBIDDEN');
    });

    it('notFound returns 404 with default message', async () => {
        const res = errors.notFound();
        expect(res.status).toBe(404);
        const body = await json(res);
        expect(body.error.code).toBe('NOT_FOUND');
    });

    it('notFound accepts custom resource name', async () => {
        const res = errors.notFound('งาน');
        const body = await json(res);
        expect(body.error.message).toContain('งาน');
    });

    it('internal returns 500', async () => {
        const res = errors.internal();
        expect(res.status).toBe(500);
        const body = await json(res);
        expect(body.error.code).toBe('INTERNAL_ERROR');
    });

    it('tooManyRequests returns 429', async () => {
        const res = errors.tooManyRequests();
        expect(res.status).toBe(429);
        const body = await json(res);
        expect(body.error.code).toBe('RATE_LIMIT');
    });
});
