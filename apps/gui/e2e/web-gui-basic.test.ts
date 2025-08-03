/**
 * Web GUI 기본 기능 E2E 테스트
 * - 무한 렌더링 이슈 재발 방지
 * - 기본 UI 인터랙션 검증
 */

import { test, expect } from '@playwright/test';

const WEB_URL = 'http://localhost:5173';

test.describe('Web GUI Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(WEB_URL);
    await page.waitForSelector('[data-testid="app-layout"]', { timeout: 10000 });
  });

  test('should load without infinite rendering errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(5000);
    expect(errors).toHaveLength(0, `Infinite rendering detected: ${errors.join(', ')}`);
  });

  test('should render main layout components', async ({ page }) => {
    await expect(page.getByText('AgentOS Chat')).toBeVisible();
    await expect(page.getByText('Week 2 UX Testing Mode')).toBeVisible();
    await expect(page.getByText('Chat Area (Week 2 UX Testing Mode)')).toBeVisible();
    await expect(page.getByRole('button', { name: '➕ New Chat' })).toBeVisible();
    await expect(page.getByRole('button', { name: '⚙️ Settings' })).toBeVisible();
  });

  test('should handle button clicks correctly', async ({ page }) => {
    const consoleLogs: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });

    await page.getByRole('button', { name: '➕ New Chat' }).click();
    await page.waitForTimeout(500);

    expect(consoleLogs.some((log) => log.includes('New Chat clicked'))).toBeTruthy();

    await page.getByRole('button', { name: '⚙️ Settings' }).click();
    await page.waitForTimeout(500);

    expect(consoleLogs.some((log) => log.includes('Settings clicked'))).toBeTruthy();
  });
});
