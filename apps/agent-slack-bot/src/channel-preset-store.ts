import fs from 'fs/promises';
import path from 'path';

export interface ChannelPresetStore {
  getPreset(channelId: string): Promise<string | null>;
  setPreset(channelId: string, presetId: string): Promise<void>;
  listChannels(): Promise<{ channelId: string; presetId: string }[]>;
}

export class FileBasedChannelPresetStore implements ChannelPresetStore {
  constructor(private readonly baseDir: string) {}

  private resolvePath(channelId: string): string {
    return path.join(this.baseDir, `${channelId}.json`);
  }

  async getPreset(channelId: string): Promise<string | null> {
    try {
      const raw = await fs.readFile(this.resolvePath(channelId), 'utf-8');
      const data = JSON.parse(raw);
      return data.presetId ?? null;
    } catch {
      return null;
    }
  }

  async setPreset(channelId: string, presetId: string): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    await fs.writeFile(this.resolvePath(channelId), JSON.stringify({ presetId }, null, 2), 'utf-8');
  }

  async listChannels(): Promise<{ channelId: string; presetId: string }[]> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const entries = await fs.readdir(this.baseDir);
    const result: { channelId: string; presetId: string }[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) {
        continue;
      }
      const channelId = entry.replace(/\.json$/, '');
      const presetId = (await this.getPreset(channelId)) ?? '';
      result.push({ channelId, presetId });
    }
    return result;
  }
}
