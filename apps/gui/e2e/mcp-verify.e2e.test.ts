import { test, expect } from '@playwright/test';
import { openManagementView } from './utils/navigation';

test.describe('MCP Verify - UI smoke', () => {
  test('dashboard, MCP tools, agents render and link correctly', async ({ page }) => {
    await page.goto('/');

    // Initial chat landing should show chat controls or empty state CTA
    const messageInput = page.getByPlaceholder(/Type a message/i);
    if ((await messageInput.count()) > 0) {
      await expect(messageInput.first()).toBeVisible();
    } else {
      const navDashboard = page.getByTestId('nav-dashboard');
      if (await navDashboard.count()) {
        await expect(navDashboard.first()).toBeVisible();
      } else {
        await expect(
          page
            .getByRole('button', { name: /(Manage|Explore Features|Create First Agent)/i })
            .first()
        ).toBeVisible();
      }
    }

    await openManagementView(page);

    // Disambiguate: prefer the main H1 inside management content
    // Select the larger H1 version
    const dashboardH1 = page.locator('h1.text-2xl:has-text("Dashboard")');
    await expect(dashboardH1.first()).toBeVisible();
    await expect(page.getByText('Recent Activity')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();

    // MCP Tools page
    const navTools = page.getByTestId('nav-tools');
    if (await navTools.count()) {
      await navTools.click();
      await expect(page.getByText('MCP Tools')).toBeVisible();
      // Disambiguate quick stat labels
      await expect(page.locator('text=Connected').first()).toBeVisible();
      await expect(page.locator('text=Total Tools').first()).toBeVisible();
    }

    // Agents + Create flow shows AI Config with MCP Tools
    const navAgents = page.getByTestId('nav-subagents');
    if (await navAgents.count()) {
      await navAgents.click();
      await expect(page.getByText('Agent Manager')).toBeVisible();
      await expect(page.getByTestId('btn-create-agent')).toBeVisible();
      await page.getByTestId('btn-create-agent').click();
      await expect(page.getByText('Agent Overview')).toBeVisible();
      await page.getByRole('button', { name: 'Next: Category' }).click();
      await page.getByRole('button', { name: /Development.*software engineering/i }).click();
      await page.getByRole('button', { name: 'Next: AI Config' }).click();
      await expect(page.getByText('MCP Tools')).toBeVisible();
    }
  });
});
