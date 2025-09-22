import { expect, Page } from '@playwright/test';

/**
 * Ensures the management view (Dashboard/Sidebar layout) is visible.
 * Handles both chat-first landing and empty-state flows by triggering
 * the appropriate CTA (Manage / Go to Dashboard) when necessary.
 */
export async function openManagementView(page: Page): Promise<void> {
  const navDashboard = page.getByTestId('nav-dashboard');
  const dashboardHeading = page.getByRole('heading', { name: /dashboard/i });
  const navSubagents = page.getByTestId('nav-subagents');
  if ((await navDashboard.count()) > 0) {
    await expect(navDashboard.first()).toBeVisible();
    return;
  }
  if ((await dashboardHeading.count()) > 0) {
    await expect(dashboardHeading.first()).toBeVisible();
    return;
  }

  const candidates = [
    page.getByTestId('btn-open-management'),
    page.getByRole('button', { name: /^Manage$/ }),
    page.getByRole('button', { name: /Manage Agents/i }),
    page.getByRole('button', { name: /Explore Features/i }),
    page.getByRole('button', { name: /Create First Agent/i }),
    page.getByRole('button', { name: /Go to Dashboard/i }),
  ];

  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.first().click();
      await Promise.race([
        navDashboard.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
        dashboardHeading
          .first()
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => {}),
        navSubagents.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {}),
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

  await dashboardHeading.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if ((await dashboardHeading.count()) > 0) {
    await expect(dashboardHeading.first()).toBeVisible();
    return;
  }

  await navSubagents.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if ((await navSubagents.count()) > 0) {
    await expect(navSubagents.first()).toBeVisible();
    return;
  }

  throw new Error('Unable to open management view — navigation CTA not found');
}
