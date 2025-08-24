import { LlmManifest } from 'llm-bridge-spec';
import { LlmBridgeStore } from '../stores/llm-bridge-store';
import z from 'zod';

const sample: LlmManifest = {
  schemaVersion: '1.0.0',
  name: 'Echo',
  language: 'typescript',
  entry: 'echo.ts',
  configSchema: z.object({
    message: z.string(),
  }),
  capabilities: {
    modalities: ['text'],
    supportsToolCall: true,
    supportsFunctionCall: true,
    supportsMultiTurn: true,
    supportsStreaming: true,
    supportsVision: true,
  },
  description: 'Echo',
  models: [],
};

test('save and list bridges', () => {
  const store = new LlmBridgeStore();
  store.save(sample);
  const bridges = store.list();
  expect(bridges).toHaveLength(1); // 기본 2개 + 추가 1개
  expect(bridges.find((b) => b.name === 'Echo')).toBeDefined();
});

test('delete bridge', () => {
  const store = new LlmBridgeStore();
  store.save(sample);
  store.delete('Echo');
  expect(store.list()).toHaveLength(0); // 기본 2개만 남음
});
