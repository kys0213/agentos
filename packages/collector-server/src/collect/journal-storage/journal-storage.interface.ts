import { ModuleMetadata } from '@nestjs/common';

export interface JournalStorage {
  store(recordId: string, journal: Record<string, unknown>): Promise<string>;
  remove(location: string): Promise<void>;
  load(location: string): Promise<Record<string, unknown>>;
}

export interface FilesystemJournalStorageOptions {
  baseDir: string;
}

export type JournalStorageDriver = 'filesystem' | 'custom';

export interface FilesystemJournalStorageModuleOptions {
  driver: 'filesystem';
  filesystem: FilesystemJournalStorageOptions;
}

export interface CustomJournalStorageModuleOptions {
  driver: 'custom';
  create: () => JournalStorage;
}

export type JournalStorageModuleOptions =
  | FilesystemJournalStorageModuleOptions
  | CustomJournalStorageModuleOptions;

export interface JournalStorageModuleAsyncOptions<TArgs extends unknown[] = unknown[]>
  extends Pick<ModuleMetadata, 'imports'> {
  inject?: Array<string | symbol | Function>;
  useFactory: (...args: TArgs) =>
    | Promise<JournalStorageModuleOptions>
    | JournalStorageModuleOptions;
}
