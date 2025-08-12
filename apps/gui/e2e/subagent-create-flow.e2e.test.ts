import { test, expect } from '@playwright/test';

test.describe('Preset → Agent create flow', () => {
  test('creates a preset, then creates an agent using it', async ({ page }) => {
    await page.goto('/');

    // Navigate to Presets via sidebar
    await page.getByTestId('nav-presets').click();

    // Open create preset wizard dialog
    await page.getByTestId('btn-create-project').click();
    await expect(page.getByText('Create New Agent Project')).toBeVisible();

    const presetName = `E2E Preset ${Date.now()}`;

    // Step 1: Basic Information
    await page.getByPlaceholder('e.g., Research Assistant').fill(presetName);
    await page
      .getByPlaceholder('Describe what this agent specializes in...')
      .fill('E2E preset description');

    // Proceed to final step and create
    // Step 2
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 3
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 4
    await page.getByRole('button', { name: 'Next' }).click();
    // Step 5: Create Preset
    await page.getByTestId('btn-create-preset').click();

    // Ensure dialog closed and new preset appears in list/grid
    await expect(page.getByText(presetName)).toBeVisible();

    // Navigate to Sub Agents
    await page.getByTestId('nav-subagents').click();

    // Click Create Agent
    await page.getByTestId('btn-create-agent').click();

    const agentName = `E2E Agent ${Date.now()}`;

    // Fill Overview step
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('E2E agent description');
    await page.getByRole('button', { name: /Next: Choose Category/i }).click();

    // Category step → next
    await page.getByRole('button', { name: /Next: Choose Preset/i }).click();

    // Preset step: select the created preset
    await page.getByText(presetName, { exact: true }).first().click();
    await page.getByRole('button', { name: /Next: Agent Settings/i }).click();

    // Final: Create Agent
    await page.getByTestId('btn-final-create-agent').click();

    // Back on Sub Agent Manager, agent should appear
    await expect(page.getByText(agentName)).toBeVisible();
  });
});
