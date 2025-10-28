import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

const ensureManagementView = async (window: Page): Promise<void> => {
  const navSubagents = window.getByTestId('nav-subagents');
  if ((await navSubagents.count()) > 0) {
    await expect(navSubagents.first()).toBeVisible({ timeout: 15000 });
    return;
  }

  const manageAgentsButton = window.getByRole('button', { name: /Manage Agents/i });
  if ((await manageAgentsButton.count()) > 0) {
    await manageAgentsButton.first().click();
    await expect(navSubagents.first()).toBeVisible({ timeout: 15000 });
    return;
  }

  const manageAgentsText = window.getByText('Manage Agents', { exact: true });
  if ((await manageAgentsText.count()) > 0) {
    await manageAgentsText.first().click();
    await expect(navSubagents.first()).toBeVisible({ timeout: 15000 });
    return;
  }

  await openManagementView(window);
  await expect(navSubagents.first()).toBeVisible({ timeout: 15000 });
};

test('SubAgent 생성 마법사를 완료한다', async () => {
  const harness = await launchElectronHarness();

  try {
    await ensureManagementView(harness.window);

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
    await expect(bridgeSelect).toBeEnabled({ timeout: 15000 });
    await bridgeSelect.click();

    await harness.window.getByRole('option', { name: /e2e/i }).first().click();

    await harness.window.waitForSelector('[data-testid="select-llm-model"]', {
      state: 'visible',
      timeout: 15000,
    });
    const modelSelect = harness.window.getByTestId('select-llm-model').first();
    await expect(modelSelect).toBeEnabled({ timeout: 15000 });
    await modelSelect.click();
    await harness.window.getByRole('option').first().click();

    await harness.window.getByRole('button', { name: 'Next: Agent Settings' }).click();
    const activeCard = harness.window
      .getByRole('button', { name: /Auto-participate in conversations/i })
      .first();

    await expect(activeCard).toBeVisible({ timeout: 10000 });
    await activeCard.click();
    await expect(activeCard).toHaveClass(/bg-primary\/5/, { timeout: 5000 });
    const finalButton = harness.window.getByTestId('btn-submit-agent');
    if (process.env.PW_ELECTRON_DEBUG_BODY === 'true') {
      const finalSnippet = await harness.window.locator('body').innerText();
      console.log('[e2e-debug] body snippet before final submit:', finalSnippet.slice(0, 800));
    }
    await expect(finalButton).toBeEnabled({ timeout: 10000 });
    await finalButton.click();

    await expect(harness.window.getByText(agentName).first()).toBeVisible();

    const backToChat = harness.window.getByRole('button', { name: /Back to Chat/i });
    if ((await backToChat.count()) > 0) {
      await backToChat.first().click();
    }

    let navDashboard = harness.window.getByTestId('nav-dashboard').first();
    if ((await navDashboard.count()) === 0) {
      await openManagementView(harness.window);
      navDashboard = harness.window.getByTestId('nav-dashboard').first();
    }

    await expect(navDashboard).toBeVisible();
    await navDashboard.click();
    await expect(harness.window.getByRole('heading', { name: 'Dashboard' }).first()).toBeVisible({
      timeout: 10_000,
    });

    await expect(harness.window.getByText(agentName).first()).toBeVisible({ timeout: 10_000 });
  } finally {
    await closeElectronHarness(harness);
  }
});

test('필수 입력 없이 제출 시 단계별 오류 알림을 보여준다', async () => {
  const harness = await launchElectronHarness();

  try {
    await ensureManagementView(harness.window);

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

    await harness.window.evaluate(() => {
      (window as unknown as { __agentAlerts?: string[] }).__agentAlerts = [];
      window.alert = (message?: string) => {
        (window as unknown as { __agentAlerts: string[] }).__agentAlerts.push(String(message ?? ''));
      };
    });

    const submitButton = harness.window.getByRole('button', { name: 'Create Agent' }).first();
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    const alerts = await harness.window.evaluate(() =>
      (window as unknown as { __agentAlerts?: string[] }).__agentAlerts ?? []
    );
    expect(alerts.pop()).toContain('Agent name is required');

    await expect(harness.window.getByText(/Agent name is required/i)).toBeVisible();
    await expect(harness.window.getByRole('tab', { name: 'Overview' })).toHaveAttribute(
      'aria-selected',
      'true'
    );

    const agentName = `Validation Agent ${Date.now()}`;

    await harness.window.getByLabel(/Agent Name/i).fill(agentName);
    await harness.window.getByLabel(/Description/i).fill('Valid agent for alert scenario');
    await harness.window.getByRole('button', { name: 'Next: Category' }).click();
    await harness.window.getByRole('button', { name: /General Purpose/i }).click();
    await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

    await harness.window
      .getByPlaceholder("Enter the system prompt that guides your agent's behavior...")
      .fill('You are validating the wizard.');

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

    await submitButton.click();
    await expect(harness.window.getByText(agentName)).toBeVisible();
  } finally {
    await closeElectronHarness(harness);
  }
});
