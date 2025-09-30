import type { Page } from '@playwright/test';

interface ScenarioContext {
  page: Page;
  screenshot: (options: { path: string; fullPage?: boolean }) => Promise<void>;
}

export default async function managerEmptyScenario({ page, screenshot }: ScenarioContext) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const navAgents = page.getByTestId('nav-subagents').first();
  if (await navAgents.isVisible()) {
    await navAgents.click();
  }
  await page.waitForSelector('text=Sub Agent Manager');
  await screenshot({ path: 'manager-subagents.png', fullPage: true });

  const navTools = page.getByTestId('nav-tools').first();
  if (await navTools.isVisible()) {
    await navTools.click();
    await page.waitForSelector('text=Tool Manager');
    await screenshot({ path: 'manager-tools.png', fullPage: true });
  }

  const navToolBuilder = page.getByTestId('nav-toolbuilder').first();
  if (await navToolBuilder.isVisible()) {
    await navToolBuilder.click();
    await page.waitForSelector('text=Tool Builder');
    await screenshot({ path: 'manager-toolbuilder.png', fullPage: true });
  }
}
