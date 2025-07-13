import { tmpdir } from 'node:os';
import path from 'node:path';
import { Preset } from '@agentos/core';
import { PresetStore, loadPresets, savePreset, deletePreset } from '../stores/preset-store';

const tempDir = path.join(tmpdir(), 'preset-store-test');

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

test('save and load presets', async () => {
  const store = new PresetStore({ cwd: tempDir });
  await savePreset(store, sample);
  const presets = await loadPresets(store);
  expect(presets).toHaveLength(1);
  expect(presets[0].name).toBe('sample');
});

test('delete preset', async () => {
  const store = new PresetStore({ cwd: tempDir + '2' });
  await savePreset(store, sample);
  await deletePreset(store, sample.id);
  const presets = await loadPresets(store);
  expect(presets).toHaveLength(0);
});
