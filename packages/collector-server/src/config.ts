export type CollectorJournalStorageDriver = 'filesystem';

export interface CollectorFilesystemJournalStorageConfig {
  driver: 'filesystem';
  baseDir: string;
}

export type CollectorJournalStorageConfig = CollectorFilesystemJournalStorageConfig;

export interface CollectorServerConfig {
  port: number;
  apiKey: string;
  dbPath: string;
  journalStorage: CollectorJournalStorageConfig;
}

export const COLLECTOR_CONFIG = Symbol('COLLECTOR_CONFIG');

function parsePort(value: string | undefined): number {
  const fallback = 3333;
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`Invalid COLLECTOR_PORT value: ${value}`);
  }
  return parsed;
}

function resolveJournalStorageConfig(driver: CollectorJournalStorageDriver, baseDirEnv: string | undefined): CollectorJournalStorageConfig {
  switch (driver) {
    case 'filesystem': {
      const baseDir = baseDirEnv && baseDirEnv.trim() !== '' ? baseDirEnv : 'collector-journals';
      return {
        driver: 'filesystem',
        baseDir,
      };
    }
    default:
      throw new Error(`Unsupported COLLECTOR_JOURNAL_DRIVER: ${driver satisfies never}`);
  }
}

export function loadConfig(): CollectorServerConfig {
  const apiKey = process.env.COLLECTOR_API_KEY;
  if (!apiKey) {
    throw new Error('COLLECTOR_API_KEY must be provided');
  }

  const port = parsePort(process.env.COLLECTOR_PORT ?? process.env.PORT);
  const dbPath = process.env.COLLECTOR_DB_PATH ?? 'collector-server.sqlite';
  const driver = (process.env.COLLECTOR_JOURNAL_DRIVER ?? 'filesystem') as CollectorJournalStorageDriver;
  const journalStorage = resolveJournalStorageConfig(driver, process.env.COLLECTOR_JOURNAL_DIR);

  return {
    port,
    apiKey,
    dbPath,
    journalStorage,
  };
}
