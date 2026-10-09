import { test, expect } from '@playwright/test';

test('loads the app and shows the title', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle('QR Studio');
  await expect(page.getByRole('heading', { level: 1, name: 'QR Studio' })).toBeVisible();
});
