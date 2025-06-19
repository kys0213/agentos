import { tmpdir } from 'node:os';
import path from 'node:path';
import { LlmBridgeStore, LlmBridgeConfig } from '../llm-bridge-store';

const tempDir = path.join(tmpdir(), 'bridge-store-test');

const sample: LlmBridgeConfig = { id: 'x', type: 'echo' };

test('save and list bridges', () => {
  const store = new LlmBridgeStore({ cwd: tempDir });
  store.save(sample);
  const bridges = store.list();
  expect(bridges).toHaveLength(1);
  expect(bridges[0].id).toBe('x');
});

test('delete bridge', () => {
  const store = new LlmBridgeStore({ cwd: tempDir + '2' });
  store.save(sample);
  store.delete('x');
  expect(store.list()).toHaveLength(0);
});
