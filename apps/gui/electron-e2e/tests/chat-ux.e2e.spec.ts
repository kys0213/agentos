import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test('Agent 생성 후 채팅 echo 응답을 확인한다', async () => {
  const harness = await launchElectronHarness();

  try {
    await openManagementView(harness.window);

    const navSubagents = harness.window.getByTestId('nav-subagents');
    await expect(navSubagents.first()).toBeVisible();
    await navSubagents.first().click();

    const createAgentButton = harness.window.getByTestId('btn-create-agent');
    if (await createAgentButton.count()) {
      await createAgentButton.first().click();
    } else {
      const emptyTrigger = harness.window.getByRole('button', { name: /Create Agent/i });
      await emptyTrigger.first().click();
    }
    const agentName = `PW Chat Agent ${Date.now()}`;
    await harness.window.getByLabel(/Agent Name/i).fill(agentName);
    await harness.window.getByLabel(/Description/i).fill('Agent for chat UX test');
    await harness.window.getByRole('button', { name: 'Next: Category' }).click();

    await harness.window
      .getByRole('button', { name: /Development.*software engineering/i })
      .click();
    await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

    const promptArea = harness.window.getByPlaceholder(
      "Enter the system prompt that guides your agent's behavior..."
    );
    await promptArea.fill('You are a helpful verifier bot.');

    await harness.window.waitForSelector('[data-testid="select-llm-bridge"]', {
      state: 'visible',
      timeout: 15000,
    });
    const bridgeSelect = harness.window.getByTestId('select-llm-bridge').first();
    await bridgeSelect.click();
    await harness.window.getByRole('option', { name: /e2e/i }).first().click();

    await harness.window.waitForSelector('[data-testid="select-llm-model"]', {
      state: 'visible',
      timeout: 15000,
    });
    const modelSelect = harness.window.getByTestId('select-llm-model').first();
    await modelSelect.click();
    await harness.window.getByRole('option').first().click();

    await harness.window.getByRole('button', { name: 'Next: Agent Settings' }).click();
    const activeCard = harness.window
      .getByRole('button', { name: /Auto-participate in conversations/i })
      .first();
    await activeCard.click();
    await expect(activeCard).toHaveClass(/bg-primary\/5/, { timeout: 5000 });

    const submitButton = harness.window.getByTestId('btn-submit-agent');
    await expect(submitButton).toBeEnabled({ timeout: 10000 });
    await submitButton.click();
    await expect(harness.window.getByText(agentName)).toBeVisible();

    const emptyState = harness.window.getByText(/No agents available/i);
    if (await emptyState.count()) {
      await expect(emptyState).toBeHidden({ timeout: 15_000 });
    }

    const input = harness.window.getByPlaceholder(/Type a message/i).first();
    await expect(input).toBeVisible({ timeout: 10000 });
    await input.click();
    await input.fill('Hello from Playwright');
    await input.press('Enter');
    await expect(
      harness.window.getByText('E2E response: Hello from Playwright')
    ).toBeVisible({ timeout: 5000 });
  } finally {
    await closeElectronHarness(harness);
  }
});
