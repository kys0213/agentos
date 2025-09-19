import { expect, Page } from '@playwright/test';

/**
 * Ensures the management view (Dashboard/Sidebar layout) is visible.
 * Handles both chat-first landing and empty-state flows by triggering
 * the appropriate CTA (Manage / Go to Dashboard) when necessary.
 */
export async function openManagementView(page: Page): Promise<void> {
  const navDashboard = page.getByTestId('nav-dashboard');
  if ((await navDashboard.count()) > 0) {
    await expect(navDashboard.first()).toBeVisible();
    return;
  }

  const candidates = [
    page.getByRole('button', { name: /^Manage$/ }),
    page.getByRole('button', { name: /Manage Agents/i }),
    page.getByRole('button', { name: /Explore Features/i }),
    page.getByRole('button', { name: /Create First Agent/i }),
    page.getByRole('button', { name: /Go to Dashboard/i }),
  ];

  for (const candidate of candidates) {
    if (await candidate.count()) {
      await candidate.first().click();
      await navDashboard.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
      if (await navDashboard.count()) {
        return;
      }
    }
  }

  await navDashboard.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
  if (await navDashboard.count()) {
    return;
  }

  throw new Error('Unable to open management view — navigation CTA not found');
}
