import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Core Health', () => {

    test('01 - API Health Check responds correctly', async ({ request }) => {
        const response = await request.get('/api/test');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.success).toBe(true);
    });

    test('02 - Landing Page loads with Kinn branding', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle('Kinn - Pro Assistant');
        await expect(page.getByRole('link', { name: 'Kinn.' }).first()).toBeVisible();
    });

    test('03 - Public Legal Pages are accessible', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('h1')).toContainText('นโยบายความเป็นส่วนตัว');

        await page.goto('/terms');
        await expect(page.locator('h1')).toContainText('ข้อกำหนดการให้บริการ');
    });

    test('04 - Admin Login validation works', async ({ page }) => {
        await page.goto('/admin/login');
        const emailInput = page.locator('input[type="email"]');
        const passwordInput = page.locator('input[type="password"]');
        const submitBtn = page.locator('button[type="submit"]');

        // Test invalid email
        await emailInput.fill('invalid-email');
        await emailInput.blur();
        await expect(page.locator('text=รูปแบบอีเมลไม่ถูกต้อง')).toBeVisible();
        // Removed toBeDisabled check because we now allow clicking for feedback

        // Test password length
        await passwordInput.fill('123');
        await passwordInput.blur();
        await expect(page.locator('text=รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeVisible();
    });

    test('05 - Dashboard loads and shows New Task button', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page.getByTestId('new-task-btn')).toBeVisible();
    });

    test('06 - Full E2E Task Creation flow', async ({ page }) => {
        // Skip in CI/Mock mode if no real DB is available
        if (process.env.NEXT_PUBLIC_MOCK_LIFF === 'true') {
            test.skip(true, 'Skipping real DB task creation in mock mode');
        }
        await page.goto('/dashboard');

        // 1. Open Modal
        await page.getByTestId('new-task-btn').click();
        await expect(page.locator('text=Select Category')).toBeVisible();

        // 2. Select Category & Next
        await page.locator('text=Travel & Logistics').click();
        await page.getByTestId('task-next-btn').click();
        await expect(page.locator('text=Task Details')).toBeVisible();

        // 3. Fill Details & Submit
        const title = `E2E Smoke Task ${Date.now()}`;
        await page.getByTestId('task-title-input').fill(title);
        await page.getByTestId('task-submit-btn').click();

        // 4. Verify task appears in the list (Playwright auto-retries across reloads)
        await expect(page.locator(`text=${title}`)).toBeVisible({ timeout: 15000 });
    });

});
