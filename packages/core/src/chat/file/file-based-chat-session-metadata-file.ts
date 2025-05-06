import fs from 'fs/promises';
import path from 'path';
import { FileBasedSessionMetadata } from './file-based-session.metadata';

export class FileBasedChatSessionMetadataFile {
  private readonly fileName = 'metadata.json';
  private readonly _fullPath: string;

  constructor(directoryPath: string) {
    this._fullPath = path.join(directoryPath, this.fileName);
  }

  get fullPath(): string {
    return this._fullPath;
  }

  async exists(): Promise<boolean> {
    return fs
      .access(this._fullPath)
      .then(() => true)
      .catch(() => false);
  }

  async create(): Promise<void> {
    await fs.writeFile(this._fullPath, '');
  }

  async read(): Promise<FileBasedSessionMetadata> {
    if (!(await this.exists())) {
      throw new Error(`Session metadata not found: ${this._fullPath}`);
    }

    const content = await fs.readFile(this._fullPath, 'utf-8');
    return JSON.parse(content);
  }

  async update(metadata: FileBasedSessionMetadata): Promise<void> {
    if (!(await this.exists())) {
      await this.create();
    }

    await fs.writeFile(this._fullPath, JSON.stringify(metadata));
  }
}
