import { createChatManager } from '../utils/chat-manager';

test.skip('createChatManager returns working manager', async () => {
  const manager = createChatManager();
  const session = await manager.create();
  await session.appendMessage({
    role: 'user',
    content: { contentType: 'text', value: 'hi' },
  });
  await session.commit();
  const { items } = await manager.list();
  expect(items.length).toBeGreaterThan(0);
});
