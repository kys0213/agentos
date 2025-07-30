import { McpConfigStore } from '../stores/mcp-config-store';
import { loadMcpFromStore } from '../utils/mcp-loader';

const sample = {
  type: 'stdio' as const,
  name: 'test',
  version: '1',
  command: 'echo',
};

test.skip('set and get config', async () => {
  const store = new McpConfigStore();
  await store.set(sample);
  expect(await store.get()).toEqual(sample);
});

test.skip('loadMcpFromStore returns undefined without config', () => {
  const store = new McpConfigStore();
  expect(loadMcpFromStore(store)).toBeUndefined();
});
