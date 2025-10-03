import { expect, Page } from '@playwright/test';

export async function openManagementView(window: Page): Promise<void> {
  const navDashboard = window.getByTestId('nav-dashboard');
  const dashboardHeading = window.getByRole('heading', { name: /dashboard/i });
  const navSubagents = window.getByTestId('nav-subagents');

  if ((await navDashboard.count()) > 0) {
    await expect(navDashboard.first()).toBeVisible();
    return;
  }

  if ((await dashboardHeading.count()) > 0) {
    await expect(dashboardHeading.first()).toBeVisible();
    return;
  }

  const candidates = [
    window.getByTestId('btn-open-management'),
    window.getByRole('button', { name: /^Manage$/ }),
    window.getByRole('button', { name: /Manage Agents/i }),
    window.getByRole('button', { name: /Explore Features/i }),
    window.getByRole('button', { name: /Create First Agent/i }),
    window.getByRole('button', { name: /Go to Dashboard/i }),
  ];

  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.first().click();
      await Promise.race([
        navDashboard.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
        dashboardHeading.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
        navSubagents.first().waitFor({ state: 'visible', timeout: 15000 }).catch(() => {}),
      ]).catch(() => {});

      if ((await navDashboard.count()) > 0) {
        await expect(navDashboard.first()).toBeVisible();
        return;
      }
      if ((await dashboardHeading.count()) > 0) {
        await expect(dashboardHeading.first()).toBeVisible();
        return;
      }
      if ((await navSubagents.count()) > 0) {
        await expect(navSubagents.first()).toBeVisible();
        return;
      }
    }
  }

  await dashboardHeading
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  if ((await dashboardHeading.count()) > 0) {
    await expect(dashboardHeading.first()).toBeVisible();
    return;
  }

  await navSubagents
    .first()
    .waitFor({ state: 'visible', timeout: 15000 })
    .catch(() => {});
  if ((await navSubagents.count()) > 0) {
    await expect(navSubagents.first()).toBeVisible();
    return;
  }

  const innerText = await window.evaluate(() => document.body.innerText.slice(0, 500));
  console.error('[electron-e2e] openManagementView failed. Page snapshot:', innerText);
  throw new Error('Unable to open management view — navigation CTA not found');
}
