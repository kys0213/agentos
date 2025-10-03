import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test('SubAgent 생성 마법사를 완료한다', async () => {
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
      const emptyStateButton = harness.window.getByRole('button', { name: 'Create Agent' });
      await emptyStateButton.click();
    }

    const agentName = `E2E Agent ${Date.now()}`;

    await harness.window.getByLabel(/Agent Name/i).fill(agentName);
    await harness.window.getByLabel(/Description/i).fill('E2E agent description');
    await harness.window.getByRole('button', { name: 'Next: Category' }).click();

    await harness.window
      .getByRole('button', { name: /Development.*software engineering/i })
      .click();
    await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

    await harness.window
      .getByPlaceholder("Enter the system prompt that guides your agent's behavior...")
      .fill('You are a helpful researcher.');

    if (process.env.PW_ELECTRON_DEBUG_BODY === 'true') {
      const snippet = await harness.window.locator('body').innerText();
      console.log('[e2e-debug] body snippet before bridge select:', snippet.slice(0, 800));
    }

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
    const finalButton = harness.window.getByTestId('btn-submit-agent');
    if (process.env.PW_ELECTRON_DEBUG_BODY === 'true') {
      const finalSnippet = await harness.window.locator('body').innerText();
      console.log('[e2e-debug] body snippet before final submit:', finalSnippet.slice(0, 800));
    }
    await expect(finalButton).toBeEnabled({ timeout: 10000 });
    await finalButton.click();

    await expect(harness.window.getByText(agentName)).toBeVisible();
  } finally {
    await closeElectronHarness(harness);
  }
});
