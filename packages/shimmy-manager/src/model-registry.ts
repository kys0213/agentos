import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { ShimmyError, toShimmyError } from './errors';
import type {
  ShimmyDownloadHandler,
  ShimmyModelRegistry,
  ShimmyModelRegistryOptions,
  ShimmyModelSummary,
} from './types';

const execFileAsync = promisify(execFile);

interface JsonModelRecord {
  id?: string;
  name?: string;
  model_id?: string;
  display_name?: string;
  default?: boolean;
  is_default?: boolean;
  path?: string;
  size?: number;
  size_bytes?: number;
  description?: string;
}

const isRecord = (candidate: unknown): candidate is Record<string, unknown> => {
  return typeof candidate === 'object' && candidate !== null;
};

const normalizeJsonRecord = (record: unknown): ShimmyModelSummary | null => {
  if (!isRecord(record)) {
    return null;
  }

  const candidate = record as JsonModelRecord;
  const id = candidate.id ?? candidate.model_id ?? candidate.name ?? candidate.display_name;
  if (!id) {
    return null;
  }

  return {
    id,
    isDefault: Boolean(candidate.default ?? candidate.is_default),
    path: candidate.path,
    sizeBytes: candidate.size_bytes ?? candidate.size,
    description: candidate.description,
  };
};

const parseJsonOutput = (output: string): ShimmyModelSummary[] | null => {
  try {
    const parsed: unknown = JSON.parse(output);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => normalizeJsonRecord(item))
        .filter((item): item is ShimmyModelSummary => Boolean(item));
    }

    if (isRecord(parsed)) {
      const list = parsed.models;
      if (Array.isArray(list)) {
        return list
          .map((item) => normalizeJsonRecord(item))
          .filter((item): item is ShimmyModelSummary => Boolean(item));
      }
    }
  } catch (error) {
    if (error instanceof Error && error.name !== 'SyntaxError') {
      throw error;
    }
  }

  return null;
};

const parsePlainTextOutput = (output: string): ShimmyModelSummary[] => {
  const lines = output.split(/\r?\n/);
  const summaries: ShimmyModelSummary[] = [];

  for (const line of lines) {
    const normalized = line.trim();
    if (!normalized) {
      continue;
    }

    const isDefault = normalized.startsWith('*') || /\(default\)$/i.test(normalized);
    const cleaned = normalized.replace(/^[*\-\s]+/, '');
    const modelId = cleaned.replace(/\(default\)$/i, '').trim();
    if (!modelId) {
      continue;
    }

    summaries.push({
      id: modelId,
      isDefault,
    });
  }

  return summaries;
};

export const parseShimmyModelList = (output: string): ShimmyModelSummary[] => {
  const trimmed = output.trim();
  if (!trimmed) {
    return [];
  }

  const jsonParsed = parseJsonOutput(trimmed);
  if (jsonParsed) {
    return jsonParsed;
  }

  return parsePlainTextOutput(trimmed);
};

export class ShimmyModelRegistryImpl implements ShimmyModelRegistry {
  constructor(private readonly options: ShimmyModelRegistryOptions) {}

  async listLocal(): Promise<ShimmyModelSummary[]> {
    try {
      const { stdout } = await execFileAsync(this.options.shimmyPath, ['list', '--json'], {
        env: this.createEnv(),
      });
      return parseShimmyModelList(stdout);
    } catch (error) {
      const shimmyError = toShimmyError(error, {
        code: 'MODEL_NOT_FOUND',
        message: 'Failed to list shimmy models.',
      });
      throw shimmyError;
    }
  }

  async ensureDefault(modelId: string, handler: ShimmyDownloadHandler): Promise<void> {
    const models = await this.listLocal();
    if (models.some((model) => model.id === modelId)) {
      return;
    }

    try {
      await handler(modelId, this.options.modelsDir);
    } catch (error) {
      throw toShimmyError(error, {
        code: 'DOWNLOAD_FAILED',
        message: `Failed to download shimmy model: ${modelId}.`,
      });
    }

    const refreshed = await this.listLocal();
    if (!refreshed.some((model) => model.id === modelId)) {
      throw new ShimmyError({
        code: 'MODEL_NOT_FOUND',
        message: `Model ${modelId} was not found after download completed.`,
      });
    }
  }

  private createEnv(): NodeJS.ProcessEnv {
    return {
      ...process.env,
      SHIMMY_MODELS_DIR: this.options.modelsDir,
    } satisfies NodeJS.ProcessEnv;
  }
}
