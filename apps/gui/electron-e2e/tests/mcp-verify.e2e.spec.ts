import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

test.describe('MCP Verify - Electron UI smoke', () => {
  test('Dashboard와 MCP/Agent 뷰를 순회한다', async () => {
    const harness = await launchElectronHarness();

    try {
      await openManagementView(harness.window);

      const dashboardH1 = harness.window.locator('h1.text-2xl:has-text("Dashboard")');
      await expect(dashboardH1.first()).toBeVisible();
      await expect(harness.window.getByText('Recent Activity')).toBeVisible();
      await expect(harness.window.getByText('Quick Actions')).toBeVisible();

      const navTools = harness.window.getByTestId('nav-tools');
      if (await navTools.count()) {
        await navTools.click();
        await expect(harness.window.getByText('MCP Tools')).toBeVisible();
        await expect(harness.window.locator('text=Connected').first()).toBeVisible();
        await expect(
          harness.window.getByRole('heading', { name: /Tool Manager/i }).first()
        ).toBeVisible();
      }

      const navAgents = harness.window.getByTestId('nav-subagents');
      if (await navAgents.count()) {
        await navAgents.click();
        const createAgentButton = harness.window.getByTestId('btn-create-agent');
        if (await createAgentButton.count()) {
          await createAgentButton.first().click();
        } else {
          const emptyTrigger = harness.window.getByRole('button', { name: /Create Agent/i });
          await emptyTrigger.first().click();
        }

        const agentName = `PW MCP Agent ${Date.now()}`;
        await harness.window.getByLabel(/Agent Name/i).fill(agentName);
        await harness.window.getByLabel(/Description/i).fill('Agent used to inspect MCP tooling');
        await harness.window.getByRole('button', { name: 'Next: Category' }).click();
        await harness.window
          .getByRole('button', { name: /Development.*software engineering/i })
          .click();
        await harness.window.getByRole('button', { name: 'Next: AI Config' }).click();

        await expect(harness.window.getByText('MCP Tools')).toBeVisible();
        await harness.window
          .getByPlaceholder("Enter the system prompt that guides your agent's behavior...")
          .fill('System prompt for MCP verify');

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

        await expect(harness.window.getByText('MCP Tools')).toBeVisible();

        const backToAgents = harness.window.getByRole('button', { name: /Back to Agents/i });
        if ((await backToAgents.count()) > 0) {
          await backToAgents.first().click();
          await harness.window.waitForTimeout(300);
        }
      }
    } finally {
      await closeElectronHarness(harness);
    }
  });
});
