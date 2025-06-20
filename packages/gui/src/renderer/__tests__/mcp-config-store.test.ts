import { tmpdir } from 'node:os';
import path from 'node:path';
import { McpConfigStore } from '../stores/mcp-config-store';
import { loadMcpFromStore } from '../utils/mcp-loader';

const tempDir = path.join(tmpdir(), 'mcp-store-test');

const sample = {
  type: 'stdio' as const,
  name: 'test',
  version: '1',
  command: 'echo',
};

test('set and get config', () => {
  const store = new McpConfigStore({ cwd: tempDir });
  store.set(sample);
  expect(store.get()).toEqual(sample);
});

test('loadMcpFromStore returns undefined without config', () => {
  const store = new McpConfigStore({ cwd: tempDir + '2' });
  expect(loadMcpFromStore(store)).toBeUndefined();
});
