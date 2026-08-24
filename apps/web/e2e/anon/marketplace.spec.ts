import { expect, test } from '@playwright/test';

test.describe.parallel('Anonymous user marketplace pages', () => {
  test('can access the home page', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Welcome to SourceByJay' })).toBeVisible();
    await expect(page.getByPlaceholder('What are you looking for?')).toBeVisible();
  });

  test('can access search', async ({ page }) => {
    await page.goto('/search');

    await expect(page).toHaveURL('/search');
    await expect(page.getByPlaceholder('Search products...')).toBeVisible();
  });

  test('can access a product detail page', async ({ page }) => {
    await page.goto('/products/wireless-bluetooth-earbuds-oem');

    await expect(page).toHaveURL('/products/wireless-bluetooth-earbuds-oem');
    await expect(
      page.getByRole('heading', { name: /Wireless Bluetooth Earbuds OEM/i })
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Contact Supplier' })).toBeVisible();
  });

  test('can access a supplier profile with gold badge', async ({ page }) => {
    await page.goto('/suppliers/jaytech-industries');

    await expect(page).toHaveURL('/suppliers/jaytech-industries');
    await expect(page.getByRole('heading', { name: /JayTech Industries/i })).toBeVisible();
    await expect(page.getByText('Gold')).toBeVisible();
  });

  test('gold supplier filter on search', async ({ page }) => {
    await page.goto('/search?gold=1');

    await expect(page).toHaveURL('/search?gold=1');
    await expect(page.getByText('Gold suppliers only')).toBeVisible();
  });

  test('factory tour tab shows approved gallery', async ({ page }) => {
    await page.goto('/suppliers/jaytech-industries');

    await page.getByRole('tab', { name: /Factory tour/i }).click();
    await expect(page.getByText(/SMT production line/i)).toBeVisible();
  });

  test('can access privacy and terms pages', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();

    await page.goto('/terms');
    await expect(page.getByRole('heading', { name: 'Terms of Use' })).toBeVisible();
  });

  test('footer links to legal pages', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'Privacy Policy' }).click();
    await expect(page).toHaveURL('/privacy');

    await page.goto('/');
    await page.getByRole('link', { name: 'Terms of Use' }).click();
    await expect(page).toHaveURL('/terms');
  });
});
