import { test, expect } from '@playwright/test';

test.describe('Agent create flow', () => {
  test('creates an agent using the simplified wizard', async ({ page }) => {
    await page.goto('/');

    const manageEntry = page.getByRole('button', {
      name: /(Manage Agents|Manage|Explore Features|Create First Agent)/i,
    });
    if (await manageEntry.count()) {
      await manageEntry.first().click();
    }
    await page.getByTestId('nav-subagents').click();

    await page.getByTestId('btn-create-agent').click();

    const agentName = `E2E Agent ${Date.now()}`;

    // Fill Overview step
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('E2E agent description');
    await page.getByRole('button', { name: 'Next: Category' }).click();

    // Category step → select Development and continue
    await page
      .getByRole('button', { name: /Development.*software engineering/i })
      .click();
    await page.getByRole('button', { name: 'Next: AI Config' }).click();

    // AI Config
    await page
      .getByPlaceholder("Enter the system prompt that guides your agent's behavior...")
      .fill('You are a helpful researcher.');

    const bridgeSelect = page.getByLabel('LLM Bridge');
    if (await bridgeSelect.count()) {
      await bridgeSelect.click();
      const firstBridge = page.locator('[role="option"]').first();
      if (await firstBridge.count()) {
        await firstBridge.click();
      }
    }

    await page.getByRole('button', { name: 'Next: Agent Settings' }).click();

    // Final: Create Agent
    await page.getByTestId('btn-final-create-agent').click();

    // Back on Sub Agent Manager, agent should appear
    await expect(page.getByText(agentName)).toBeVisible();
  });
});
