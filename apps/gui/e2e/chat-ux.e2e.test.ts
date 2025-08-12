import { test, expect } from '@playwright/test';

test.describe('Chat UX end-to-end', () => {
  test('create preset/agent and chat echo works', async ({ page }) => {
    await page.goto('/');

    // Presets → Create
    await page.getByTestId('nav-presets').click();
    await page.getByTestId('btn-create-project').click();
    const presetName = `PW Chat Preset ${Date.now()}`;
    await page.getByPlaceholder('e.g., Research Assistant').fill(presetName);
    await page
      .getByPlaceholder('Describe what this agent specializes in...')
      .fill('Preset for chat UX test');
    // System prompt
    await page
      .getByPlaceholder(
        "Enter the system prompt that defines this preset's behavior and personality..."
      )
      .fill('You are helpful.');
    // Go to configuration and create
    await page.getByRole('button', { name: /Next: Configuration/i }).click();
    await page.getByTestId('btn-create-preset').click();
    await expect(page.getByText(presetName)).toBeVisible();

    // Agents → Create using the preset
    await page.getByTestId('nav-subagents').click();
    await page.getByTestId('btn-create-agent').click();
    const agentName = `PW Chat Agent ${Date.now()}`;
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('Agent for chat UX test');
    await page.getByRole('button', { name: /Next: Choose Category/i }).click();
    await page.getByRole('button', { name: /Next: Choose Preset/i }).click();
    await page.getByText(presetName, { exact: true }).first().click();
    await page.getByRole('button', { name: /Next: Agent Settings/i }).click();
    await page.getByRole('button', { name: /Create Agent/i }).click();
    await expect(page.getByText(agentName)).toBeVisible();

    // Chat → send message and see echo
    await page.getByTestId('nav-chat').click();
    const input = page.getByPlaceholder('Type a message...');
    await input.click();
    await input.fill('Hello from Playwright');
    await input.press('Enter');
    await expect(page.getByText('Echo: Hello from Playwright')).toBeVisible({ timeout: 5000 });
  });
});
