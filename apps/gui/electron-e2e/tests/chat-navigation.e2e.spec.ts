import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test('ManagementView에서 Open Chat 버튼이 Chat 화면으로 이동한다', async () => {
  const harness = await launchElectronHarness();

  try {
    await openManagementView(harness.window);

    await harness.window.getByTestId('nav-models').click();
    await expect(
      harness.window.getByRole('heading', { name: /LLM Bridges/i }).first()
    ).toBeVisible();

    await harness.window.getByRole('button', { name: /Open Chat/i }).first().click();

    await expect(harness.window.getByPlaceholder(/Type a message/i).first()).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await closeElectronHarness(harness);
  }
});

test('SubAgent 카드의 Chat 버튼이 채팅 화면으로 이동한다', async () => {
  const harness = await launchElectronHarness();

  try {
    await openManagementView(harness.window);

    const navAgents = harness.window.getByTestId('nav-subagents');
    await expect(navAgents.first()).toBeVisible();
    await navAgents.first().click();

    await expect(
      harness.window.getByRole('heading', { name: /Sub Agent Manager/i }).first()
    ).toBeVisible({ timeout: 10_000 });

    const ensureAgentExists = async () => {
      const chatButtons = harness.window.getByRole('button', { name: /^Chat$/ });
      if ((await chatButtons.count()) > 0) {
        return;
      }

      const createAgentButton = harness.window.getByTestId('btn-create-agent');
      if (await createAgentButton.count()) {
        await createAgentButton.first().click();
      } else {
        const emptyStateButton = harness.window.getByRole('button', { name: /Create Agent/i });
        await emptyStateButton.first().click();
      }

      const agentName = `Preview Agent ${Date.now()}`;
      await harness.window.getByLabel(/Agent Name/i).fill(agentName);
      await harness.window.getByLabel(/Description/i).fill('Preview agent for chat card');
      await harness.window.getByRole('button', { name: 'Next: Category' }).click();

      await harness.window
        .getByRole('button', { name: /Development.*software engineering/i })
        .click();
      await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

      await harness.window
        .getByPlaceholder("Enter the system prompt that guides your agent's behavior...")
        .fill('Mini chat preview agent.');

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
      await harness.window
        .getByRole('button', { name: /Auto-participate in conversations/i })
        .first()
        .click();

      const submitButton = harness.window.getByTestId('btn-submit-agent');
      await expect(submitButton).toBeEnabled({ timeout: 10000 });
      await submitButton.click();
      await expect(harness.window.getByText(agentName)).toBeVisible();

      await openManagementView(harness.window);
      await navAgents.first().click();
      await expect(
        harness.window.getByRole('heading', { name: /Sub Agent Manager/i }).first()
      ).toBeVisible({ timeout: 10_000 });
    };

    await ensureAgentExists();

    const chatButton = harness.window.getByTestId(/agent-card-chat-/).first();
    await expect(chatButton).toBeVisible();
    await chatButton.click();

    await expect(harness.window.getByTestId('active-chat-preview')).toBeVisible({
      timeout: 10_000,
    });
  } finally {
    await closeElectronHarness(harness);
  }
});
