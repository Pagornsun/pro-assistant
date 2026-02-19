import { test, expect } from '@playwright/test';

test.describe('Dashboard (Mock Auth)', () => {
    test.beforeEach(async ({ page }) => {
        // 1. Setup Mock Routes BEFORE navigation
        await page.route('/api/dashboard/data*', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
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

        await page.route('/api/tasks*', async route => {
            const method = route.request().method();
            if (method === 'POST') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    json: { data: { id: 'new-id', title: 'New E2E Task' } }
                });
            } else {
                await route.continue();
            }
        });

        // 2. Go to dashboard
        await page.goto('/dashboard');
    });

    test('should load dashboard with mock user', async ({ page }) => {
        // Verify greeting (flexible matching for any whitespace/newline and name)
        await expect(page.getByText(/Good Morning,\s*(Test User|Guest)/i)).toBeVisible({ timeout: 15000 });
        // Verify tab bar links (checking for text in main dashboard)
        await expect(page.getByText('Existing Task')).toBeVisible();
    });

    test('should open create task modal via FAB', async ({ page }) => {
        // Look for the "New Task" button by its test-id which we know exists from smoke tests
        const newTaskBtn = page.getByTestId('new-task-btn');
        await expect(newTaskBtn).toBeVisible();
        await newTaskBtn.click();

        await expect(page.getByText('Select Category')).toBeVisible();
    });

    test('should complete full task creation flow', async ({ page }) => {
        // 1. Open Modal
        await page.getByTestId('new-task-btn').click();

        // 2. Select Category
        await page.getByText('Custom Request').click();
        await page.getByText('Next').click();

        // 3. Fill Details
        await page.getByPlaceholder('What do you need done?').fill('New E2E Task');
        await page.getByRole('button', { name: 'Create Task' }).click();

        // 4. Expect modal to close (it reloads on success)
        await expect(page.getByText('Task Details')).toBeHidden({ timeout: 15000 });
    });
});
