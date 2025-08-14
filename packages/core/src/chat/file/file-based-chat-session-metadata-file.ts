import path from 'path';
import { JsonFileHandler } from '@agentos/lang/fs';
import { FileBasedSessionMetadata } from './file-based-session.metadata';

export class FileBasedChatSessionMetadataFile {
  private readonly fileName = 'metadata.json';
  private readonly _fullPath: string;
  private readonly jsonHandler: JsonFileHandler<FileBasedSessionMetadata>;

  constructor(directoryPath: string) {
    this._fullPath = path.join(directoryPath, this.fileName);
    this.jsonHandler = JsonFileHandler.create<FileBasedSessionMetadata>(this._fullPath);
  }

  get fullPath(): string {
    return this._fullPath;
  }

  async exists(): Promise<boolean> {
    return this.jsonHandler.exists();
  }

  async create(): Promise<void> {
    const result = await this.jsonHandler.write({} as FileBasedSessionMetadata);
    if (!result.success) {
      throw new Error(`Failed to create metadata file: ${String(result.reason)}`);
    }
  }

  async read(): Promise<FileBasedSessionMetadata> {
    return this.jsonHandler.readOrThrow();
  }

  async update(metadata: FileBasedSessionMetadata): Promise<void> {
    const result = await this.jsonHandler.writeWithEnsure(metadata);
    if (!result.success) {
      throw new Error(`Failed to update metadata: ${String(result.reason)}`);
    }
  }
}
