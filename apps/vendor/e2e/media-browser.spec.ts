import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

async function openFolderByName(page: import('@playwright/test').Page, name: RegExp | string) {
  const browser = page.getByTestId('sbj-file-browser');
  await expect(browser).toBeVisible();
  // Single-click opens folders (Chonky double-click is unreliable after selection re-render)
  await browser.getByRole('listitem').filter({ hasText: name }).first().click();
}

test.describe('Seller media browser segments', () => {
  test('media library: folders layer → open folder → files layer', async ({ page }) => {
    await page.goto('/media');
    await expect(page.getByRole('heading', { name: /media library/i })).toBeVisible();

    const browser = page.getByTestId('sbj-file-browser');
    await expect(browser).toBeVisible({ timeout: 20_000 });
    await expect(browser).toHaveAttribute('data-layer', 'folders');
    await expect(browser).toHaveAttribute('data-folder', 'sbj-root');
    await expect(page.getByRole('slider', { name: /folder icon size/i })).toBeVisible();

    const folderRow = browser.getByRole('listitem').filter({ hasText: /product videos|listing images|factory/i }).first();
    await expect(folderRow).toBeVisible({ timeout: 15_000 });
    await folderRow.click();

    await expect(browser).toHaveAttribute('data-layer', 'files', { timeout: 10_000 });
    await expect(browser).not.toHaveAttribute('data-folder', 'sbj-root');
    await expect(page.getByRole('slider', { name: /file icon size/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /go up a directory/i })).toBeEnabled();

    // Prefer breadcrumb root — more stable than toolbar "Go up" after list re-renders
    await page.getByRole('navigation').getByRole('button', { name: /^Media library$/i }).click();
    await expect(browser).toHaveAttribute('data-layer', 'folders', { timeout: 10_000 });
    await expect(browser).toHaveAttribute('data-folder', 'sbj-root');
  });

  test('factory gallery: Photos/Videos open on click + files layer slider', async ({ page }) => {
    await page.goto('/gallery');
    await expect(page.getByRole('heading', { name: /factory gallery/i })).toBeVisible();

    const browser = page.getByTestId('sbj-file-browser');
    await expect(browser).toBeVisible({ timeout: 20_000 });
    await expect(browser).toHaveAttribute('data-layer', 'folders');
    await expect(page.getByRole('slider', { name: /folder icon size/i })).toBeVisible();

    await openFolderByName(page, 'Photos');
    await expect(browser).toHaveAttribute('data-folder', 'factory-photos', { timeout: 10_000 });
    await expect(browser).toHaveAttribute('data-layer', 'files');
    await expect(page.getByRole('slider', { name: /file icon size/i })).toBeVisible();

    await page.getByRole('navigation').getByRole('button', { name: /^Factory gallery$/i }).click();
    await expect(browser).toHaveAttribute('data-folder', 'sbj-root', { timeout: 10_000 });
    await expect(browser).toHaveAttribute('data-layer', 'folders');

    await openFolderByName(page, 'Videos');
    await expect(browser).toHaveAttribute('data-folder', 'factory-videos', { timeout: 10_000 });
    await expect(browser).toHaveAttribute('data-layer', 'files');
  });

  test('media library: upload JPG navigates into folder and shows file', async ({ page }) => {
    const pngPath = path.join(os.tmpdir(), `sbj-upload-${Date.now()}.png`);
    const pngBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64',
    );
    fs.writeFileSync(pngPath, pngBytes);

    await page.goto('/media');
    const browser = page.getByTestId('sbj-file-browser');
    await expect(browser).toBeVisible({ timeout: 20_000 });

    await page.locator('input[type=file]').setInputFiles(pngPath);

    await expect(page.locator('.sbj-toast-ok')).toContainText(/uploaded/i, { timeout: 15_000 });
    await expect(browser).toHaveAttribute('data-layer', 'files', { timeout: 10_000 });
    await expect(browser.getByRole('listitem').filter({ hasText: /\.png$/i }).first()).toBeVisible({
      timeout: 15_000,
    });

    fs.unlinkSync(pngPath);
  });
});
