import { test, expect } from '@playwright/test';

test.describe('Chat UX end-to-end', () => {
  test('create agent and chat echo works', async ({ page }) => {
    await page.goto('/');

    const manageEntry = page.getByRole('button', {
      name: /(Manage Agents|Manage|Explore Features|Create First Agent)/i,
    });
    if (await manageEntry.count()) {
      await manageEntry.first().click();
    }

    // Agents → Create
    await page.getByTestId('nav-subagents').click();
    await page.getByTestId('btn-create-agent').click();
    const agentName = `PW Chat Agent ${Date.now()}`;
    await page.getByLabel(/Agent Name/i).fill(agentName);
    await page.getByLabel(/Description/i).fill('Agent for chat UX test');
    await page.getByRole('button', { name: 'Next: Category' }).click();

    await page
      .getByRole('button', { name: /Development.*software engineering/i })
      .click();
    await page.getByRole('button', { name: 'Next: AI Config' }).click();

    const promptArea = page.getByPlaceholder('Enter the system prompt that guides your agent\'s behavior...');
    await promptArea.fill('You are a helpful verifier bot.');

    const bridgeSelect = page.getByLabel('LLM Bridge');
    if (await bridgeSelect.count()) {
      await bridgeSelect.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.count()) {
        await firstOption.click();
      }
    }

    const modelSelect = page.getByLabel('Model');
    if (await modelSelect.count()) {
      await modelSelect.click();
      const firstModel = page.locator('[role="option"]').first();
      if (await firstModel.count()) {
        await firstModel.click();
      }
    }

    await page.getByRole('button', { name: 'Next: Agent Settings' }).click();
    await page.getByRole('button', { name: 'Create Agent' }).click();
    await expect(page.getByText(agentName)).toBeVisible();

    // Chat → send message and see echo
    const navChat = page.getByTestId('nav-chat');
    if ((await navChat.count()) > 0) {
      await navChat.click();
    }
    const input = page.getByPlaceholder('Type a message...');
    await input.click();
    await input.fill('Hello from Playwright');
    await input.press('Enter');
    await expect(page.getByText('Echo: Hello from Playwright')).toBeVisible({ timeout: 5000 });
  });
});
