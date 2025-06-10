import chalk from 'chalk';
import { ChatManager } from '@agentos/core';
import { browseHistory } from './history';
import { createUserInputStream } from './utils/user-input-stream';

export async function browseSessions(manager: ChatManager): Promise<void> {
  const { items } = await manager.list();
  const pageSize = 10;
  const pages = Math.ceil(items.length / pageSize);

  let pageIndex = 0;

  const showPage = () => {
    const start = pageIndex * pageSize;
    const end = start + pageSize;
    const page = items.slice(start, end);
    console.log(chalk.yellow(`\n-- Sessions Page ${pageIndex + 1}/${pages} --`));
    page.forEach((s: (typeof items)[number], idx: number) => {
      const title = s.title || '(no title)';
      const time = s.updatedAt.toISOString();
      console.log(`${idx + 1}. [${time}] ${s.id} - ${title}`);
    });
  };

  const stream = createUserInputStream({
    prompt: '(number) open, (n)ext, (p)rev, (q)uit: ',
  })
    .quit('q')
    .on(/^n$/i, async () => {
      if (pageIndex + 1 < pages) {
        pageIndex++;
        showPage();
      } else {
        console.log('No next page.');
      }
    })
    .on(/^p$/i, async () => {
      if (pageIndex > 0) {
        pageIndex--;
        showPage();
      }
    })
    .on(/^(\d+)$/i, async (m) => {
      const num = parseInt(m[1], 10);
      const start = pageIndex * pageSize;
      const end = start + pageSize;
      const page = items.slice(start, end);
      if (!Number.isNaN(num) && num >= 1 && num <= page.length) {
        const session = page[num - 1];
        await browseHistory(manager, session.id);
        showPage();
      }
    })
    .build();

  showPage();

  await stream.run();
}
