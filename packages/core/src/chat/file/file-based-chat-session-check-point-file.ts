import path from 'path';
import fs from 'fs/promises';
import { Checkpoint } from '../chat-session';
import { json, validation } from '@agentos/lang';

const { isPlainObject } = validation;

export class FileBasedChatSessionCheckpointFile {
  private readonly fileName = 'checkpoint.json';
  private readonly _fullPath: string;

  constructor(directoryPath: string) {
    this._fullPath = path.join(directoryPath, this.fileName);
  }

  get fullPath(): string {
    return this._fullPath;
  }

  async exists(): Promise<boolean> {
    return fs
      .access(this.fullPath)
      .then(() => true)
      .catch(() => false);
  }

  async create(): Promise<void> {
    await fs.writeFile(this.fullPath, '');
  }

  async read(): Promise<Checkpoint | undefined> {
    if (!(await this.exists())) {
      return;
    }

    try {
      const content = await fs.readFile(this.fullPath, 'utf-8');
      const parsed = json.parseJsonWithFallback(content, null, {
        validator: isPlainObject,
      });

      if (!parsed) {
        console.warn(`Invalid checkpoint format in ${this.fullPath}`);
        return undefined;
      }

      return parsed as Checkpoint;
    } catch (error) {
      console.error(`Failed to read checkpoint from ${this.fullPath}:`, error);
      return undefined;
    }
  }

  async readOrThrow(): Promise<Checkpoint> {
    const checkpoint = await this.read();

    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${this.fullPath}`);
    }

    return checkpoint;
  }

  async update(checkpoint: Checkpoint): Promise<void> {
    if (!(await this.exists())) {
      await this.create();
    }

    await fs.writeFile(this.fullPath, JSON.stringify(checkpoint));
  }
}
