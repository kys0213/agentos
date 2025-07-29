import { Preset } from '../types/core-types';
import { PresetStore, loadPresets, savePreset, deletePreset } from '../stores/preset-store';

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
};

test.skip('save and load presets', async () => {
  const store = new PresetStore();
  await savePreset(store, sample);
  const presets = await loadPresets(store);
  expect(presets).toHaveLength(1);
  expect(presets[0].name).toBe('sample');
});

test.skip('delete preset', async () => {
  const store = new PresetStore();
  await savePreset(store, sample);
  await deletePreset(store, sample.id);
  const presets = await loadPresets(store);
  expect(presets).toHaveLength(0);
});
