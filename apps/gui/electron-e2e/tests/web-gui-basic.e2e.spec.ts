import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test.describe('Electron GUI 기본 기능', () => {
  test('무한 렌더링 오류 없이 초기화된다', async () => {
    const errors: string[] = [];
    const harness = await launchElectronHarness({
      onConsole: (msg) => {
        if (msg.type() === 'error' && msg.text().includes('Maximum update depth')) {
          errors.push(msg.text());
        }
      },
    });

    try {
      await harness.window.waitForTimeout(2000);
      expect(errors).toHaveLength(0);
    } finally {
      await closeElectronHarness(harness);
    }
  });

  test('관리 뷰 진입 경로가 노출된다', async () => {
    const harness = await launchElectronHarness();

    try {
      await harness.window.waitForTimeout(1000);
      const navDashboard = harness.window.getByTestId('nav-dashboard');
      const manageToggle = harness.window.getByTestId('btn-open-management');
      const fallbackButton = harness.window.getByRole('button', {
        name: /(Manage|Manage Agents|Explore Features|Create Agent|Go to Dashboard)/i,
      });

      const hasNav = (await navDashboard.count()) > 0;
      const hasManageToggle = (await manageToggle.count()) > 0;
      const hasFallback = (await fallbackButton.count()) > 0;

      expect(hasNav || hasManageToggle || hasFallback).toBe(true);
    } finally {
      await closeElectronHarness(harness);
    }
  });

  test('관리 버튼을 통해 Dashboard로 이동한다', async () => {
    const harness = await launchElectronHarness();

    try {
      await openManagementView(harness.window);
      await expect(harness.window.getByTestId('nav-dashboard').first()).toBeVisible();
      await expect(
        harness.window.getByRole('heading', { name: 'Dashboard' }).first()
      ).toBeVisible();
    } finally {
      await closeElectronHarness(harness);
    }
  });
});
