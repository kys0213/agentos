/**
 * Web GUI 기본 기능 E2E 테스트
 * - 무한 렌더링 이슈 재발 방지
 * - 기본 UI 인터랙션 검증
 */

import { test, expect } from '@playwright/test';
import { openManagementView } from './utils/navigation';

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

  test('should render chat layout with management entry points', async ({ page }) => {
    const navDashboard = page.getByTestId('nav-dashboard');
    const chatInput = page.getByPlaceholder(/Type a message/i);
    await Promise.race([
      navDashboard.first().waitFor({ state: 'visible', timeout: 5000 }),
      chatInput.first().waitFor({ state: 'visible', timeout: 5000 }),
    ]).catch(() => {});

    if (await navDashboard.count()) {
      await expect(navDashboard.first()).toBeVisible();
    } else {
      await expect(chatInput.first()).toBeVisible();
      const controlButton = page.getByRole('button', {
        name: /(Manage|Manage Agents|Explore Features)/i,
      });
      await expect(controlButton.first()).toBeVisible();
    }
  });

  test('Manage button navigates to Dashboard', async ({ page }) => {
    await openManagementView(page);
    await expect(page.getByTestId('nav-dashboard').first()).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible();
  });
});
