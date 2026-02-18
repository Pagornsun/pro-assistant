import { test, expect } from '@playwright/test';

test.describe('Admin Login', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/admin/login');
    });

    test('should have required attributes for empty submission check', async ({ page }) => {
        // Since HTML5 validation blocks submission, we just check attributes
        await expect(page.getByLabel(/Email/i)).toHaveAttribute('required');
        await expect(page.getByLabel(/Password/i)).toHaveAttribute('required');
    });

    test('should show error for invalid email format', async ({ page }) => {
        await page.getByLabel(/Email/i).fill('invalid-email');
        await page.getByLabel(/Password/i).fill('password123');
        // Click login
        await page.getByRole('button', { name: /Authorize|Login/i }).click();

        // Expect Thai error message
        await expect(page.getByText('รูปแบบอีเมลไม่ถูกต้อง')).toBeVisible();
    });

    test('should show error for short password', async ({ page }) => {
        await page.getByLabel(/Email/i).fill('admin@kinn.ai');
        await page.getByLabel(/Password/i).fill('short');
        await page.getByRole('button', { name: /Authorize|Login/i }).click();

        // Expect Thai error message
        await expect(page.getByText('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')).toBeVisible();
    });
});
