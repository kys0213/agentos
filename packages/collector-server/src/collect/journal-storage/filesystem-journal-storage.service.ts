import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { FilesystemJournalStorageOptions, JournalStorage } from './journal-storage.interface';

@Injectable()
export class FilesystemJournalStorageService implements JournalStorage {
  private readonly logger = new Logger(FilesystemJournalStorageService.name);

  constructor(private readonly options: FilesystemJournalStorageOptions) {}

  async store(recordId: string, journal: Record<string, unknown>): Promise<string> {
    await fs.mkdir(this.options.baseDir, { recursive: true });
    const filePath = join(this.options.baseDir, `${recordId}.json`);
    await fs.writeFile(filePath, JSON.stringify(journal), 'utf8');
    return filePath;
  }

  async remove(location: string): Promise<void> {
    try {
      await fs.unlink(location);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.debug(`Journal file already removed: ${location}`);
        return;
      }
      throw error;
    }
  }

  async load(location: string): Promise<Record<string, unknown>> {
    const contents = await fs.readFile(location, 'utf8');
    return JSON.parse(contents) as Record<string, unknown>;
  }
}
