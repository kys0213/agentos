import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { FileBasedPresetRepository } from '../file-based-preset.repository';
import { Preset } from '../preset';

describe('FileBasedPresetRepository', () => {
  const base = path.join(tmpdir(), 'preset-repo-test');
  const repo = new FileBasedPresetRepository(base);
  const preset: Preset = {
    id: 'p1',
    name: 'test',
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

  afterEach(async () => {
    await fs.rm(base, { recursive: true, force: true });
  });

  test('create and get', async () => {
    await repo.create(preset);
    const loaded = await repo.get(preset.id);
    expect(loaded?.name).toBe('test');
  });

  test('list', async () => {
    await repo.create(preset);
    const { items } = await repo.list();
    expect(items.length).toBe(1);
  });

  test('delete', async () => {
    await repo.create(preset);
    await repo.delete(preset.id);
    const { items } = await repo.list();
    expect(items.length).toBe(0);
  });
});
