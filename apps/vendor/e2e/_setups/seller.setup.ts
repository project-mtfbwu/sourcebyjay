import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';

const authFile = path.join(__dirname, '../.auth/seller.json');

setup('seller login', async ({ page }) => {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });

  await page.goto('/login');
  await page.getByRole('textbox', { name: /seller email/i }).fill('ads-demo-seller@sourcebyjay.test');
  await page.getByRole('textbox', { name: /password/i }).fill('Password123!');
  await page.getByRole('button', { name: /seller login/i }).click();

  await expect(page).toHaveURL(/localhost:3001\/?(?:\?|$)/, { timeout: 30_000 });
  await expect(page.getByText(/SparkAds Factory|Seller Central|Dashboard/i).first()).toBeVisible({
    timeout: 30_000,
  });

  await page.context().storageState({ path: authFile });
});
