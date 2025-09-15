/*
  Lightweight Playwright verification against running GUI (http://localhost:5173)
  - Checks key flows and UI for recent MCP/Dashboard/SubAgent/Preset logic
  - Saves screenshots to .playwright-mcp/
*/

import { chromium, Page } from '@playwright/test';

const BASE_URL = process.env.GUI_URL ?? 'http://localhost:5173';
const OUT_DIR = '.playwright-mcp';

async function shot(page: Page, name: string) {
  await page.screenshot({ path: `${OUT_DIR}/verify-${name}.png`, fullPage: false });
}

async function expectVisible(page: Page, locatorDesc: string, timeout = 7000) {
  const loc = page.locator(locatorDesc);
  await loc.first().waitFor({ state: 'visible', timeout });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  const results: string[] = [];

  try {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await shot(page, 'home');

    // 1) Initial chat UI renders
    await expectVisible(page, "input[placeholder*='Type a message']");
    results.push('OK: Chat input visible');

    // Sidebar should exist with nav items; if not, use in-chat button to navigate
    const navDashboard = page.getByTestId('nav-dashboard');
    if (await navDashboard.count()) {
      await navDashboard.click();
    } else {
      const goToDashboard = page.getByRole('button', { name: /Go to Dashboard/i });
      if (await goToDashboard.count()) await goToDashboard.click();
    }
    await expectVisible(page, "text=Dashboard");
    await expectVisible(page, "text=Recent Activity");
    await expectVisible(page, "text=Quick Actions");
    await shot(page, 'dashboard');
    results.push('OK: Dashboard renders core sections');

    // 2) MCP Tools manager page
    const navTools = page.getByTestId('nav-tools');
    if (await navTools.count()) {
      await navTools.click();
      await expectVisible(page, "text=MCP Tools");
      await expectVisible(page, "text=Connected");
      await expectVisible(page, "text=Total Tools");
      await shot(page, 'mcp-tools');
      results.push('OK: MCP Tools manager visible');
    } else {
      results.push('WARN: nav-tools not found');
    }

    // 3) Presets manager
    const navPresets = page.getByTestId('nav-presets');
    if (await navPresets.count()) {
      await navPresets.click();
      await expectVisible(page, "text=Agent Projects");
      await expectVisible(page, "[data-testid='btn-create-project']");
      await shot(page, 'presets');
      results.push('OK: Presets manager visible');
    } else {
      results.push('WARN: nav-presets not found');
    }

    // 4) Agents manager + agent create (AI Config includes MCP Tools list)
    const navSubagents = page.getByTestId('nav-subagents');
    if (await navSubagents.count()) {
      await navSubagents.click();
      await expectVisible(page, "text=Agent Manager");
      await expectVisible(page, "[data-testid='btn-create-agent']");
      await shot(page, 'agents');
      results.push('OK: Agent Manager visible');

      // Open create and verify AI Config tab and MCP Tools section renders
      await page.getByTestId('btn-create-agent').click();
      await expectVisible(page, "text=Agent Overview");
      await page.getByRole('tab', { name: 'AI Config' }).click();
      await expectVisible(page, "text=MCP Tools");
      await shot(page, 'agent-create-ai-config');
      results.push('OK: Agent Create shows MCP Tools in AI Config');
    } else {
      results.push('WARN: nav-subagents not found');
    }

    console.log(JSON.stringify({ ok: true, results }, null, 2));
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Verification failed:', err);
    await shot(page, 'error');
    console.log(JSON.stringify({ ok: false, error: String(err) }, null, 2));
    await browser.close();
    process.exit(1);
  }
}

run();
