import { expect, test } from '@playwright/test';
import { launchElectronHarness, closeElectronHarness } from '../runner/electronHarness';
import { openManagementView } from '../support/openManagementView';

const shouldRun = process.env.E2E_OLLAMA === 'true';

test.skip(!shouldRun, 'Requires local Ollama bridge bundle to be installed.');

test('Ollama 브리지가 앱 초기 구동 시 자동 등록된다', async () => {
  const harness = await launchElectronHarness();

  try {
    await openManagementView(harness.window);

    const navModels = harness.window.getByTestId('nav-models');
    await expect(navModels.first()).toBeVisible();
    await navModels.first().click();

    await expect(harness.window.getByRole('heading', { name: /LLM Bridges/i })).toBeVisible();

    await harness.window
      .getByText('Loading model configurations…', { exact: false })
      .first()
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {});

    const bodySnapshot = await harness.window.locator('body').innerText();
    console.log('[ollama-bundle] body snapshot:', bodySnapshot.slice(0, 400));

    const ollamaHeading = harness.window.getByRole('heading', { name: /ollama-llm-bridge/i });
    await expect(ollamaHeading).toBeVisible({ timeout: 20000 });

    const ollamaCard = harness.window
      .locator('div', {
        has: ollamaHeading,
      })
      .first();

    await expect(ollamaCard).not.toContainText(/Paused/i);
    await expect(ollamaCard).toContainText(/(Standby|Connected)/i, { timeout: 10000 });
    await expect(
      ollamaCard.getByRole('button', { name: /(Activate|Active)/i }).first()
    ).toBeVisible();
  } finally {
    await closeElectronHarness(harness);
  }
});
