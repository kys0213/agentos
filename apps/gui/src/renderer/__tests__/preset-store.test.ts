import { Preset } from '@agentos/core';
import { PresetStore } from '../stores/preset-store';

const sample: Preset = {
  id: '1',
  name: 'sample',
  description: '',
  author: '',
  createdAt: new Date(),
  updatedAt: new Date(),
  version: '1.0.0',
  systemPrompt: '',
  enabledMcps: [],
  llmBridgeName: '',
  llmBridgeConfig: {},
  status: 'active',
  usageCount: 0,
  knowledgeDocuments: 0,
  knowledgeStats: {
    indexed: 0,
    vectorized: 0,
    totalSize: 0,
  },
  category: ['general'],
};

test.skip('save and load presets', async () => {
  const store = new PresetStore();
  await store.save(sample);
  const presets = await store.list();
  expect(presets).toHaveLength(1);
  expect(presets[0].name).toBe('sample');
});

test.skip('delete preset', async () => {
  const store = new PresetStore();
  await store.save(sample);
  await store.delete(sample.id);
  const presets = await store.list();
  expect(presets).toHaveLength(0);
});
