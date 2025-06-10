import chalk from 'chalk';
import { ChatManager, ChatSessionDescription, MessageHistory } from '@agentos/core';
import { paginate } from './pagination';
import { createUserInputStream } from './utils/user-input-stream';

export async function browseSessions(manager: ChatManager): Promise<void> {
  const iterator = paginate<ChatSessionDescription>(async (cursor?: string) =>
    manager.list({
      cursor: cursor ?? '',
      limit: 5,
      direction: 'forward',
    })
  );

  const pages: ChatSessionDescription[][] = [];
  let pageIndex = 0;

  const loadNext = async () => {
    const { value, done } = await iterator.next();
    if (done || !value) {
      return false;
    }
    pages.push(value);
    return true;
  };

  if (!(await loadNext())) {
    console.log('No sessions.');
    return;
  }

  const showPage = () => {
    const page = pages[pageIndex];
    console.log(chalk.green(`\nSessions (page ${pageIndex + 1})`));
    page.forEach((s, i) => {
      const title = s.title ? `${s.title} - ` : '';
      console.log(`${i + 1}. ${title}${s.id}`);
    });
  };

  const stream = createUserInputStream({
    prompt: '(number) open, (n)ext, (p)rev, (q)uit: ',
  })
    .quit('q')
    .on(/^n$/i, async () => {
      if (pageIndex + 1 < pages.length) {
        pageIndex++;
      } else if (await loadNext()) {
        pageIndex++;
      } else {
        console.log('No next page.');
        return;
      }
      showPage();
    })
    .on(/^p$/i, async () => {
      if (pageIndex > 0) {
        pageIndex--;
        showPage();
      }
    })
    .on(/^(\d+)$/i, async (m) => {
      const num = parseInt(m[1], 10);
      const page = pages[pageIndex];
      if (!Number.isNaN(num) && num >= 1 && num <= page.length) {
        await browseHistory(manager, page[num - 1].id);
        showPage();
      }
    })
    .build();

  showPage();

  await stream.run();
}

export async function browseHistory(manager: ChatManager, sessionId: string): Promise<void> {
  const session = await manager.load({ sessionId });
  const iterator = paginate<Readonly<MessageHistory>>(async (cursor?: string) =>
    session.getHistories({
      cursor: cursor ?? '',
      limit: 5,
      direction: 'forward',
    })
  );

  const pages: Readonly<MessageHistory>[][] = [];
  let pageIndex = 0;

  const loadNext = async () => {
    const { value, done } = await iterator.next();
    if (done || !value) {
      return false;
    }
    pages.push(value);
    return true;
  };

  if (!(await loadNext())) {
    console.log('No messages.');
    return;
  }

  const showPage = () => {
    console.log(chalk.yellow(`\nHistory (page ${pageIndex + 1})`));
    const page = pages[pageIndex];
    for (const message of page) {
      const content =
        !Array.isArray(message.content) && message.content.contentType === 'text'
          ? message.content.value
          : '[non-text]';
      const time = message.createdAt.toISOString();
      console.log(`${chalk.gray('[' + time + ']')} ${chalk.cyan(message.role)}: ${content}`);
    }
  };

  const stream = createUserInputStream({ prompt: '(n)ext, (p)rev, (q)uit: ' })
    .quit('q')
    .on(/^n$/i, async () => {
      if (pageIndex + 1 < pages.length) {
        pageIndex++;
      } else if (await loadNext()) {
        pageIndex++;
      } else {
        console.log('No next page.');
        return;
      }
      showPage();
    })
    .on(/^p$/i, async () => {
      if (pageIndex > 0) {
        pageIndex--;
        showPage();
      }
    })
    .build();

  showPage();

  await stream.run();
}
