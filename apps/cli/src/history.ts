import chalk from 'chalk';
import { ChatManager, MessageHistory } from '@agentos/core';
import { Page } from './pagination';
import { PageCache } from './page-cache';
import { createUserInputStream } from './utils/user-input-stream';

export async function browseHistory(manager: ChatManager, sessionId: string): Promise<void> {
  const pageSize = 20;
  const cacheSize = parseInt(process.env.AGENTOS_PAGE_CACHE_SIZE ?? '5', 10);

  const session = await manager.load({ sessionId, agentId: 'cli-agent' });

  const fetchPage = async (cursor?: string) =>
    session.getHistories({ cursor: cursor ?? '', limit: pageSize, direction: 'forward' });

  const cache = new PageCache<Page<Readonly<MessageHistory>>>(cacheSize);
  const cursors = new Map<number, string | undefined>();
  let lastLoaded = -1;
  let nextCursor: string | undefined = '';

  const ensurePage = async (index: number): Promise<Page<Readonly<MessageHistory>> | undefined> => {
    const cached = cache.get(index);
    if (cached) {
      return cached;
    }

    if (index <= lastLoaded) {
      const start = cursors.get(index);
      const result = await fetchPage(start);
      const page: Page<Readonly<MessageHistory>> = {
        items: result.items,
        startCursor: start,
        nextCursor: result.nextCursor,
      };
      cache.set(index, page, start);
      cursors.set(index + 1, result.nextCursor);
      return page;
    }

    while (lastLoaded < index) {
      const start = nextCursor;
      const result = await fetchPage(start);
      if (!result.items.length && !result.nextCursor) {
        return undefined;
      }
      lastLoaded++;
      const page: Page<Readonly<MessageHistory>> = {
        items: result.items,
        startCursor: start,
        nextCursor: result.nextCursor,
      };
      cache.set(lastLoaded, page, start);
      cursors.set(lastLoaded, start);
      nextCursor = result.nextCursor;
      cursors.set(lastLoaded + 1, nextCursor);
    }

    return cache.get(index);
  };

  if (!(await ensurePage(0))) {
    console.log('No messages.');
    return;
  }

  let pageIndex = 0;

  const showPage = async () => {
    console.log(chalk.yellow(`\n-- Messages Page ${pageIndex + 1} --`));
    const page = await ensurePage(pageIndex);
    if (!page) {
      return;
    }
    for (const message of page.items) {
      const first = Array.isArray(message.content) ? message.content[0] : (message.content as any);
      const content = first && first.contentType === 'text' ? first.value : '[non-text]';
      const time = message.createdAt.toISOString();
      console.log(`${chalk.gray('[' + time + ']')} ${chalk.cyan(message.role)}: ${content}`);
    }
  };

  const stream = createUserInputStream({ prompt: '(n)ext, (p)rev, (q)uit: ' })
    .quit('q')
    .on(/^n$/i, async () => {
      const nextPage = await ensurePage(pageIndex + 1);
      if (!nextPage) {
        console.log('No next page.');
        return;
      }
      pageIndex++;
      await showPage();
    })
    .on(/^p$/i, async () => {
      if (pageIndex > 0) {
        pageIndex--;
        await showPage();
      }
    })
    .build();

  await showPage();

  await stream.run();
}

export const showHistory = browseHistory;
