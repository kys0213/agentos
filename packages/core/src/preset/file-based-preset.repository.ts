import path from 'path';
import { fs } from '@agentos/lang';
import { CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { Preset } from './preset';
import { PresetRepository, PresetSummary } from './preset.repository';

export class FileBasedPresetRepository implements PresetRepository {
  constructor(private readonly baseDir: string) {}

  async list(): Promise<CursorPaginationResult<PresetSummary>> {
    await fs.FileUtils.ensureDir(this.baseDir);
    const entriesResult = await fs.FileUtils.readDir(this.baseDir);
    if (!entriesResult.success) {
      return { items: [], nextCursor: '', hasMore: false };
    }
    const entries = entriesResult.result;
    const items: PresetSummary[] = [];
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue;
      const preset = await this.get(entry.replace(/\.json$/, ''));
      if (preset) {
        items.push({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          updatedAt: preset.updatedAt,
        });
      }
    }
    items.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    return { items, nextCursor: '', hasMore: false };
  }

  async get(id: string): Promise<Preset | null> {
    const filePath = this.resolvePath(id);
    const jsonHandler = fs.JsonFileHandler.create<Preset>(filePath);

    const result = await jsonHandler.read();
    if (!result.success) {
      return null;
    }

    const data = result.result;
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
    } as Preset;
  }

  async create(preset: Preset): Promise<void> {
    await this.saveFile(preset.id, preset);
  }

  async update(id: string, preset: Preset): Promise<void> {
    await this.saveFile(id, preset);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.resolvePath(id);
    const result = await fs.FileUtils.remove(filePath);
    if (!result.success) {
      throw new Error(`Failed to delete preset: ${String(result.reason)}`);
    }
  }

  private async saveFile(id: string, preset: Preset): Promise<void> {
    const filePath = this.resolvePath(id);
    const jsonHandler = fs.JsonFileHandler.create<Preset>(filePath);

    const result = await jsonHandler.write(preset, {
      prettyPrint: true,
      indent: 2,
      ensureDir: true,
    });
    if (!result.success) {
      throw new Error(`Failed to save preset: ${String(result.reason)}`);
    }
  }

  private resolvePath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }
}
