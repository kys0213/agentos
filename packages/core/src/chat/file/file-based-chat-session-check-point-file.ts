import path from 'path';
import fs from 'fs/promises';
import { Checkpoint } from '../chat-session';

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

    const content = await fs.readFile(this.fullPath, 'utf-8');
    return JSON.parse(content);
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
