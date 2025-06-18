import fs from 'fs/promises';
import path from 'path';
import { CursorPaginationResult } from '../common/pagination/cursor-pagination';
import { Preset } from './preset';
import { PresetRepository, PresetSummary } from './preset.repository';

export class FileBasedPresetRepository implements PresetRepository {
  constructor(private readonly baseDir: string) {}

  async list(): Promise<CursorPaginationResult<PresetSummary>> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const entries = await fs.readdir(this.baseDir);
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
    return { items, nextCursor: '' };
  }

  async get(id: string): Promise<Preset | null> {
    try {
      const filePath = this.resolvePath(id);
      const raw = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(raw);
      return {
        ...data,
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      } as Preset;
    } catch {
      return null;
    }
  }

  async create(preset: Preset): Promise<void> {
    await this.saveFile(preset.id, preset);
  }

  async update(id: string, preset: Preset): Promise<void> {
    await this.saveFile(id, preset);
  }

  async delete(id: string): Promise<void> {
    const filePath = this.resolvePath(id);
    await fs.rm(filePath, { force: true });
  }

  private async saveFile(id: string, preset: Preset): Promise<void> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const filePath = this.resolvePath(id);
    await fs.writeFile(filePath, JSON.stringify(preset, null, 2), 'utf-8');
  }

  private resolvePath(id: string): string {
    return path.join(this.baseDir, `${id}.json`);
  }
}
