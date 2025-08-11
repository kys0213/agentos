/**
 * Web GUI 기본 기능 E2E 테스트
 * - 무한 렌더링 이슈 재발 방지
 * - 기본 UI 인터랙션 검증
 */

import { test, expect } from '@playwright/test';

test.describe('Web GUI Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should load without infinite rendering errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });

  test('should render initial chat welcome screen', async ({ page }) => {
    await expect(page.getByText('Welcome to AgentOS')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Create First Agent' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Explore Features' })).toBeVisible();
  });

  test('Explore Features navigates to Dashboard', async ({ page }) => {
    await page.getByRole('button', { name: 'Explore Features' }).click();
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});

