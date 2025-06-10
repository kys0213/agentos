import readline from 'node:readline/promises';
import chalk from 'chalk';
import { ChatManager } from '@agentos/core';
import { browseHistory } from './history';

export async function browseSessions(manager: ChatManager): Promise<void> {
  const { items } = await manager.list();
  const pageSize = 10;
  const pages = Math.ceil(items.length / pageSize);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let pageIndex = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    const page = items.slice(start, end);
    console.log(chalk.yellow(`\n-- Sessions Page ${pageIndex + 1}/${pages} --`));
    page.forEach((s: (typeof items)[number], idx: number) => {
      const title = s.title || '(no title)';
      const time = s.updatedAt.toISOString();
      console.log(`${idx + 1}. [${time}] ${s.id} - ${title}`);
    });

    const input = await rl.question('(number) open, (n)ext, (p)rev, (q)uit: ');
    if (input === 'n') {
      if (pageIndex + 1 < pages) {
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
    } else {
      const num = parseInt(input, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= page.length) {
        const session = page[num - 1];
        await browseHistory(manager, session.id);
      }
    }
  }

  rl.close();
}
