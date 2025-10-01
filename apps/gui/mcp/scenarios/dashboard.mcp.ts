import type { Page } from '@playwright/test';

interface ScenarioContext {
  page: Page;
  screenshot: (options: { path: string; fullPage?: boolean }) => Promise<void>;
}

export default async function dashboardScenario({ page, screenshot }: ScenarioContext) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const navDashboard = page.getByTestId('nav-dashboard').first();
  if (await navDashboard.isVisible()) {
    await navDashboard.click();
  }

  await page.waitForSelector('text=Dashboard');
  await screenshot({ path: 'dashboard.png', fullPage: true });

  await page.getByText('Agent Activity', { exact: false }).waitFor();
  await screenshot({ path: 'dashboard-agent-activity.png' });
}
