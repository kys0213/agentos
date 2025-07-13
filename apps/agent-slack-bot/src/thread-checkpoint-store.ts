import fs from 'fs/promises';
import path from 'path';
import { Checkpoint } from '@agentos/core';

export interface ThreadCheckpointStore {
  getCheckpoint(channelId: string, threadTs: string): Promise<Checkpoint | null>;
  saveCheckpoint(channelId: string, threadTs: string, checkpoint: Checkpoint): Promise<void>;
}

export class FileBasedThreadCheckpointStore implements ThreadCheckpointStore {
  constructor(private readonly baseDir: string) {}

  private resolveDir(channelId: string): string {
    return path.join(this.baseDir, channelId);
  }

  private resolvePath(channelId: string, threadTs: string): string {
    return path.join(this.resolveDir(channelId), `${threadTs}.json`);
  }

  async getCheckpoint(channelId: string, threadTs: string): Promise<Checkpoint | null> {
    try {
      const raw = await fs.readFile(this.resolvePath(channelId, threadTs), 'utf-8');
      const data = JSON.parse(raw);
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        coveringUpTo: new Date(data.coveringUpTo),
        message: { ...data.message, createdAt: new Date(data.message.createdAt) },
      } as Checkpoint;
    } catch {
      return null;
    }
  }

  async saveCheckpoint(channelId: string, threadTs: string, checkpoint: Checkpoint): Promise<void> {
    const dir = this.resolveDir(channelId);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.resolvePath(channelId, threadTs),
      JSON.stringify(checkpoint, null, 2),
      'utf-8'
    );
  }
}
