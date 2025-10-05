import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './electron-e2e/tests',
  testMatch: ['**/*.e2e.spec.ts', '**/*.e2e.test.ts'],
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.PW_REPORTER ?? 'line',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    screenshot: 'only-on-failure',
    video: 'off',
    trace: process.env.CI ? 'on-first-retry' : 'off',
  },
  projects: [
    {
      name: 'electron',
    },
  ],
});
