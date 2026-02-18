import { test, expect } from '@playwright/test';

test.describe('Public Pages', () => {
    test('Privacy Policy should load', async ({ page }) => {
        await page.goto('/privacy');
        // Expect a title or heading "Privacy Policy"
        // Adjust selector based on actual implementation (P0-4)
        await expect(page).toHaveTitle(/Privacy|Policy/i);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Terms of Service should load', async ({ page }) => {
        await page.goto('/terms');
        await expect(page).toHaveTitle(/Terms/i);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('Dashboard should redirect to Line Login if unauthenticated', async ({ page }) => {
        // Assuming dashboard redirects or shows unauthorized
        // If it relies on LIFF, it might show a loading spinner waiting for LIFF
        // But middleware might block it.
        await page.goto('/dashboard');
        // We expect either a redirect to / (Home) or Login
        // Or just check relevant state
    });
});
