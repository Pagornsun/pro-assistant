import { test, expect } from '@playwright/test';

test.describe('Dashboard (Mock Auth)', () => {
    test.beforeEach(async ({ page }) => {
        // Go to dashboard
        await page.goto('/dashboard');
    });

    test('should load dashboard with mock user', async ({ page }) => {
        // Verify greeting
        await expect(page.getByText('Good Morning, Test User')).toBeVisible({ timeout: 10000 });
        // Verify tab bar
        await expect(page.getByRole('link', { name: 'Tasks' })).toBeVisible();
    });

    test('should open create task modal', async ({ page }) => {
        // Click FAB
        await page.getByRole('button', { name: 'Create Task' }).click(); // Assuming aria-label or text
        // If FAB doesn't have text, we might need a better selector. 
        // Let's use internal text or look for the plus icon if needed.
        // Actually FAB usually has accessible name. Check later.
        // Fallback: look for the modal directly if it's open (it won't be).

        // Let's try locating by id or class if standard accessible roles fail in dev.
        // For now, assuming the FAB has some identifier. 
        // In DashboardActions.tsx: <button ... className="..."> <Plus /> </button>
        // It might not have aria-label.

        // Using a more generic selector for the FAB (bottom right button) if strictly needed:
        // await page.locator('button.fixed.bottom-24').click();

        // Better: Add aria-label to the FAB in DashboardActions.tsx later if test fails.
        // For now let's guess it might be tested via visual or just finding the "Subject" input after clicking *something*.

        const fab = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
        await fab.click();

        await expect(page.getByText('Select Category')).toBeVisible();
    });

    test('should create a task', async ({ page }) => {
        // Mock API POST /api/tasks to avoid DB spam? 
        // Or let it hit the DB? "Integration E2E" usually hits DB.
        // But we are mocking Auth. The backend won't know "mock-user-id".
        // "mock-user-id" doesn't exist in Supabase `auth.users`, nor `public.profiles`.
        // So GET /api/tasks will fail with 500 or 401 if it checks DB constraints or RLS.

        // WAIT. If I use "mock-user-id", API calls will send `x-line-user-id: mock-user-id`.
        // The backend `getProfile` does: supabase.from('profiles').select().eq('line_user_id', 'mock-user-id').
        // If that returns null, the API throws error.

        // So E2E with Mock Auth on Frontend requires:
        // A) Mocking API responses (Playwright `page.route`), OR
        // B) Seeding the DB with "mock-user-id".

        // Mocking API is safer and faster for Frontend E2E.

        await page.route('/api/tasks*', async route => {
            const method = route.request().method();
            await route.continue();
        });

        // ADDED: Mock Dashboard Data
        await page.route('/api/dashboard/data*', async route => {
            await route.fulfill({
                json: {
                    data: {
                        profile: { userId: 'mock-user-id', displayName: 'Test User' },
                        membership: 'pro',
                        tasks: [
                            { id: '1', title: 'Existing Task', status: 'pending', due_date: null, tags: [] }
                        ]
                    }
                }
            });
        });

        // Mock Tasks API
        await page.route('/api/tasks', async route => {
            const method = route.request().method();
            if (method === 'POST') {
                await route.fulfill({
                    json: { data: { id: 'new-id', title: 'New E2E Task' } }
                });
            } else {
                await route.continue();
            }
        });

        // verify load
        await expect(page.getByText('Test User')).toBeVisible();

        // Fill form
        const fab = page.locator('button').filter({ has: page.locator('svg.lucide-plus') });
        await fab.click();

        await page.getByText('Custom Request').click();
        await page.getByText('Next').click();

        await page.getByPlaceholder('What do you need done?').fill('New E2E Task');
        await page.getByRole('button', { name: 'Create Task' }).click();

        // Expect success toast
        await expect(page.getByText('สร้างงานสำเร็จ!')).toBeVisible();
    });
});
