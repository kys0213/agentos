import { test, expect } from '@playwright/test';

test.describe('MCP Verify - UI smoke', () => {
  test('dashboard, MCP tools, presets, agents render and link correctly', async ({ page }) => {
    await page.goto('/');

    // Initial chat view present
    await expect(page.getByPlaceholder(/Type a message/i)).toBeVisible();

    // Enter Management mode via Chat sidebar "Manage" button
    const manageBtn = page.getByRole('button', { name: /^Manage$/ });
    if (await manageBtn.count()) {
      await manageBtn.click();
    } else {
      // Fallback: Go to Dashboard if present
      const goBtn = page.getByRole('button', { name: /Go to Dashboard/i });
      if (await goBtn.count()) await goBtn.click();
    }

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

    // Presets page
    const navPresets = page.getByTestId('nav-presets');
    if (await navPresets.count()) {
      await navPresets.click();
      await expect(page.getByRole('heading', { name: 'Agent Projects' })).toBeVisible();
      await expect(page.getByTestId('btn-create-project')).toBeVisible();
    }

    // Agents + Create flow shows AI Config with MCP Tools
    const navAgents = page.getByTestId('nav-subagents');
    if (await navAgents.count()) {
      await navAgents.click();
      await expect(page.getByText('Agent Manager')).toBeVisible();
      await expect(page.getByTestId('btn-create-agent')).toBeVisible();
      await page.getByTestId('btn-create-agent').click();
      await expect(page.getByText('Agent Overview')).toBeVisible();
      await page.getByRole('tab', { name: 'AI Config' }).click();
      await expect(page.getByText('MCP Tools')).toBeVisible();
    }
  });
});
