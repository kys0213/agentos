import chalk from 'chalk';
import readline from 'node:readline/promises';
import { ChatManager, MessageHistory } from '@agentos/core';
import { createManager } from './chat-manager';
import { paginate } from './pagination';

export async function browseHistory(sessionId: string): Promise<void> {
  const manager: ChatManager = createManager();
  const session = await manager.load({ sessionId });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const iterator = paginate((cursor?: string) => session.getHistories({ cursor, limit: 20 }));

  const pages: MessageHistory[][] = [];
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
    rl.close();
    return;
  }

  // eslint-disable-next-line no-constant-condition
  while (true) {
    console.log(chalk.yellow(`\n-- Messages Page ${pageIndex + 1} --`));
    const page = pages[pageIndex];
    for (const message of page) {
      const content = message.content.contentType === 'text' ? message.content.value : '[non-text]';
      const time = message.createdAt.toISOString();
      console.log(`${chalk.gray('[' + time + ']')} ${chalk.cyan(message.role)}: ${content}`);
    }

    const input = await rl.question('(n)ext, (p)rev, (q)uit: ');
    if (input === 'n') {
      if (pageIndex + 1 < pages.length) {
        pageIndex++;
      } else if (await loadNext()) {
        pageIndex++;
      } else {
        console.log('No next page.');
      }
    } else if (input === 'p') {
      if (pageIndex > 0) {
        pageIndex--;
      }
    } else if (input === 'q') {
      break;
    }
  }

  rl.close();
}

export const showHistory = browseHistory;
