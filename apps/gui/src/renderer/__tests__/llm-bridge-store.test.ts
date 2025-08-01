import { tmpdir } from 'node:os';
import path from 'node:path';
import { LlmBridgeStore, LlmBridgeConfig } from '../stores/llm-bridge-store';

const tempDir = path.join(tmpdir(), 'bridge-store-test');

const sample: LlmBridgeConfig = { id: 'x', type: 'echo' };

test('save and list bridges', () => {
  const store = new LlmBridgeStore();
  store.save(sample);
  const bridges = store.list();
  expect(bridges).toHaveLength(3); // 기본 2개 + 추가 1개
  expect(bridges.find((b) => b.id === 'x')).toBeDefined();
});

test('delete bridge', () => {
  const store = new LlmBridgeStore();
  store.save(sample);
  store.delete('x');
  expect(store.list()).toHaveLength(2); // 기본 2개만 남음
});
