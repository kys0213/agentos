import { test, expect } from '@playwright/test';

test.describe('Chat send/receive flow', () => {
  test('create preset + agent, then send a chat message and see reply', async ({ page }) => {
    await page.goto('/');

    // If welcome screen shows, navigate to Presets
    const goPresets = page.getByTestId('nav-presets');
    await goPresets.click();

    // Create a Preset
    await page.getByTestId('btn-create-project').click();
    const presetName = `E2E Chat Preset ${Date.now()}`;
    await page.getByPlaceholder('e.g., Research Assistant').fill(presetName);
    await page
      .getByPlaceholder('Describe what this agent specializes in...')
      .fill('Preset for chat E2E test');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByTestId('btn-create-preset').click();
    await expect(page.getByText(presetName)).toBeVisible();

    // Create an Agent using the preset
    await page.getByTestId('nav-subagents').click();
    await page.getByTestId('btn-create-agent').click();
    const agentName = `E2E Chat Agent ${Date.now()}`;
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('Agent for chat E2E test');
    await page.getByRole('button', { name: /Next: Choose Category/i }).click();
    await page.getByRole('button', { name: /Next: Choose Preset/i }).click();
    await page.getByText(presetName, { exact: true }).first().click();
    await page.getByRole('button', { name: /Next: Agent Settings/i }).click();
    await page.getByTestId('btn-final-create-agent').click();
    await expect(page.getByText(agentName)).toBeVisible();

    // Navigate to Chat and send a message
    await page.getByTestId('nav-chat').click();

    const input = page.getByPlaceholder('Type a message...');
    await input.click();
    await input.fill('Hello from E2E');

    // Send (press Enter)
    await input.press('Enter');

    // Expect echo reply to appear
    await expect(page.getByText('Echo: Hello from E2E')).toBeVisible({ timeout: 5000 });
  });
});

