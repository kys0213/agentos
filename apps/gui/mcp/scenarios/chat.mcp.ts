import type { Page } from '@playwright/test';

interface ScenarioContext {
  page: Page;
  screenshot: (options: { path: string; fullPage?: boolean }) => Promise<void>;
}

export default async function chatScenario({ page, screenshot }: ScenarioContext) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const navChat = page.getByTestId('nav-chat').first();
  if (await navChat.isVisible()) {
    await navChat.click();
  }

  await page.waitForSelector('text=Chat');
  await screenshot({ path: 'chat-overview.png', fullPage: true });

  const mentionListHeading = page.getByText('Available Agents');
  if (await mentionListHeading.count()) {
    await mentionListHeading.scrollIntoViewIfNeeded();
    await screenshot({ path: 'chat-mentionable.png' });
  }

  const input = page.getByPlaceholder('Type a message...');
  if (await input.count()) {
    await input.fill('Hello from Playwright MCP');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    await screenshot({ path: 'chat-response.png' });
  }
}
