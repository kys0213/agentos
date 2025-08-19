import { Test } from '@nestjs/testing';
import { PresetController } from '../preset.controller';
import { PRESET_REPOSITORY_TOKEN } from '../../common/preset/constants';
import type { PresetRepository, Preset, CursorPaginationResult } from '@agentos/core';

class InMemoryPresetRepo implements PresetRepository {
  store = new Map<string, Preset>();
  async list(): Promise<CursorPaginationResult<any>> {
    const items = Array.from(this.store.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
    }));
    return { items, nextCursor: '' };
  }
  async get(id: string): Promise<Preset | null> {
    return this.store.get(id) ?? null;
  }
  async create(preset: Preset): Promise<void> {
    this.store.set(preset.id, preset);
  }
  async update(id: string, preset: Preset): Promise<void> {
    this.store.set(id, preset);
  }
  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}

describe('PresetController', () => {
  it('creates, gets, lists and deletes presets', async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PresetController],
      providers: [{ provide: PRESET_REPOSITORY_TOKEN, useClass: InMemoryPresetRepo }],
    }).compile();

    const ctrl = moduleRef.get(PresetController);
    const now = new Date();
    const p: Preset = {
      id: 'p1',
      name: 'n',
      description: 'd',
      author: 'a',
      createdAt: now,
      updatedAt: now,
      version: '1.0.0',
      systemPrompt: 'sp',
      enabledMcps: [],
      llmBridgeName: 'b',
      llmBridgeConfig: {},
      status: 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
      category: ['general'],
    } as Preset;

    const created = await ctrl.create(p as any);
    expect(created.success).toBe(true);

    const one = await ctrl.get('p1');
    expect(one?.id).toBe('p1');

    const list = await ctrl.list();
    expect(list.items.some((s) => s.id === 'p1')).toBe(true);

    const upd = await ctrl.update({
      id: 'p1',
      preset: { ...p, name: 'n2', updatedAt: new Date() } as any,
    });
    expect(upd.success).toBe(true);

    const fetched = await ctrl.get('p1');
    expect(fetched?.name).toBe('n2');

    const del = await ctrl.remove('p1');
    expect(del.success).toBe(true);

    const gone = await ctrl.get('p1');
    expect(gone).toBeNull();
  });
});
