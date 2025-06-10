import chalk from 'chalk';
import { ChatManager, MessageHistory } from '@agentos/core';
import { paginate } from './pagination';
import { createUserInputStream } from './utils/user-input-stream';

export async function browseHistory(manager: ChatManager, sessionId: string): Promise<void> {
  const session = await manager.load({ sessionId });
  const iterator = paginate<Readonly<MessageHistory>>(async (cursor?: string) =>
    session.getHistories({
      cursor: cursor ?? '',
      limit: 20,
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
    console.log(chalk.yellow(`\n-- Messages Page ${pageIndex + 1} --`));
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

export const showHistory = browseHistory;
