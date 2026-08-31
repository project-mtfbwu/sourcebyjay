import { defineConfig, devices } from '@playwright/test';

/**
 * Fast local e2e against a running vendor app (`pnpm vendor#dev` on :3001).
 * Does not start a server — reuse what you already have open.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.VENDOR_URL ?? 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'seller-setup',
      testMatch: /_setups\/.*\.ts/,
    },
    {
      name: 'seller-media',
      testMatch: /media-browser\.spec\.ts/,
      dependencies: ['seller-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/seller.json',
      },
    },
  ],
});
