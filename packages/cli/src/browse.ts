import readline from 'node:readline/promises';
import chalk from 'chalk';
import { ChatManager, ChatSessionDescription, MessageHistory } from '@agentos/core';

export async function browseSessions(manager: ChatManager): Promise<void> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let cursor: string | undefined;
  const pages: ChatSessionDescription[][] = [];
  const cursors: (string | undefined)[] = [];
  let pageIndex = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!pages[pageIndex]) {
      const { items, nextCursor } = await manager.list({
        cursor: cursor ?? '',
        limit: 5,
        direction: 'forward',
      });
      pages[pageIndex] = items;
      cursors[pageIndex + 1] = nextCursor || undefined;
    }
    const page = pages[pageIndex];
    console.log(chalk.green(`\nSessions (page ${pageIndex + 1})`));
    page.forEach((s, i) => {
      const title = s.title ? `${s.title} - ` : '';
      console.log(`${i + 1}. ${title}${s.id}`);
    });

    const answer = await rl.question('(number) open, (n)ext, (p)rev, (q)uit: ');
    const input = answer.trim().toLowerCase();
    if (input === 'q') {
      break;
    } else if (input === 'n') {
      if (!cursors[pageIndex + 1]) {
        console.log('No more sessions.');
        continue;
      }
      cursor = cursors[pageIndex + 1];
      pageIndex++;
    } else if (input === 'p') {
      if (pageIndex === 0) {
        console.log('Already at first page.');
        continue;
      }
      pageIndex--;
      cursor = cursors[pageIndex];
    } else {
      const num = Number(input);
      if (!Number.isNaN(num) && num > 0 && num <= page.length) {
        await browseHistory(manager, page[num - 1].id, rl);
      } else {
        console.log('Invalid input');
      }
    }
  }

  rl.close();
}

export async function browseHistory(
  manager: ChatManager,
  sessionId: string,
  rlParam?: readline.Interface
): Promise<void> {
  const session = await manager.load({ sessionId });
  const rl = rlParam ?? readline.createInterface({ input: process.stdin, output: process.stdout });

  let cursor: string | undefined;
  const pages: Readonly<MessageHistory>[][] = [];
  const cursors: (string | undefined)[] = [];
  let pageIndex = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (!pages[pageIndex]) {
      const { items, nextCursor } = await session.getHistories({
        cursor: cursor ?? '',
        limit: 5,
        direction: 'forward',
      });
      pages[pageIndex] = items;
      cursors[pageIndex + 1] = nextCursor || undefined;
    }
    const page = pages[pageIndex];

    console.log(chalk.yellow(`\nHistory (page ${pageIndex + 1})`));
    for (const message of page) {
      const content =
        !Array.isArray(message.content) && message.content.contentType === 'text'
          ? message.content.value
          : '[non-text]';
      const time = message.createdAt.toISOString();
      console.log(`${chalk.gray('[' + time + ']')} ${chalk.cyan(message.role)}: ${content}`);
    }

    const answer = await rl.question('(n)ext, (p)rev, (q)uit: ');
    const input = answer.trim().toLowerCase();
    if (input === 'q') {
      break;
    } else if (input === 'n') {
      if (!cursors[pageIndex + 1]) {
        console.log('No more messages.');
        continue;
      }
      cursor = cursors[pageIndex + 1];
      pageIndex++;
    } else if (input === 'p') {
      if (pageIndex === 0) {
        console.log('Already at first page.');
        continue;
      }
      pageIndex--;
      cursor = cursors[pageIndex];
    }
  }

  if (!rlParam) {
    rl.close();
  }
}
