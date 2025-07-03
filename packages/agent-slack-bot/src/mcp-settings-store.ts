import fs from 'fs/promises';
import path from 'path';

export interface McpSettings {
  type: 'websocket' | 'sse';
  url: string;
}

export interface McpSettingsStore {
  get(): Promise<McpSettings | null>;
  save(settings: McpSettings): Promise<void>;
}

export class FileBasedMcpSettingsStore implements McpSettingsStore {
  constructor(private readonly filePath: string) {}

  async get(): Promise<McpSettings | null> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as McpSettings;
    } catch {
      return null;
    }
  }

  async save(settings: McpSettings): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, JSON.stringify(settings, null, 2), 'utf-8');
  }
}
