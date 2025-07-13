import fs from 'fs/promises';
import path from 'path';
import { tmpdir } from 'os';
import { FileBasedChannelPresetStore } from '../channel-preset-store';

describe('FileBasedChannelPresetStore', () => {
  const base = path.join(tmpdir(), 'channel-preset-store');
  let store: FileBasedChannelPresetStore;

  beforeEach(async () => {
    await fs.rm(base, { recursive: true, force: true });
    store = new FileBasedChannelPresetStore(base);
  });

  test('set and get preset', async () => {
    await store.setPreset('C1', 'preset1');
    const preset = await store.getPreset('C1');
    expect(preset).toBe('preset1');
  });

  test('listChannels returns saved presets', async () => {
    await store.setPreset('C1', 'p1');
    await store.setPreset('C2', 'p2');
    const list = await store.listChannels();
    expect(list).toEqual(
      expect.arrayContaining([
        { channelId: 'C1', presetId: 'p1' },
        { channelId: 'C2', presetId: 'p2' },
      ])
    );
  });
});
