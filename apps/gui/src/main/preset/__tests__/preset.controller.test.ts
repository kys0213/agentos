import { Test } from '@nestjs/testing';
import { GeneratedPresetController as PresetController } from '../gen/preset.controller.gen.new';
import { PRESET_REPOSITORY_TOKEN } from '../../common/preset/constants';
import type { PresetRepository, Preset, CursorPaginationResult } from '@agentos/core';

type PresetSummary = { id: string; name: string; description: string; updatedAt: Date };

class InMemoryPresetRepo implements PresetRepository {
  store = new Map<string, Preset>();
  async list(): Promise<CursorPaginationResult<PresetSummary>> {
    const items = Array.from(this.store.values()).map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      updatedAt: p.updatedAt,
    }));

    return { items, nextCursor: '', hasMore: false };
  }
  async get(id: string): Promise<Preset | null> {
    return this.store.get(id) ?? null;
  }
  async create(preset: any): Promise<Preset> {
    const p = {
      ...preset,
      id: 'p1',
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    };

    this.store.set(p.id, p);

    return p;
  }
  async update(id: string, preset: Preset): Promise<Preset> {
    this.store.set(id, preset);
    return preset;
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

    const p = {
      name: 'n',
      description: 'd',
      author: 'a',
      version: '1.0.0',
      systemPrompt: 'sp',
      enabledMcps: [],
      llmBridgeName: 'b',
      llmBridgeConfig: {},
      status: 'active',
      category: ['general'],
    };

    const created = await ctrl.create(p as any);

    if (!created.success) {
      throw new Error('Failed to create preset');
    }

    expect(created.success).toBe(true);
    expect(created.result?.id).toBeDefined();

    const one = await ctrl.get(created.result!.id!);
    expect(one?.id).toBe(created.result!.id!);

    const list = await ctrl.list();
    expect(list.items.some((s) => s.id === created.result!.id!)).toBe(true);

    const upd = await ctrl.update({
      id: created.result!.id!,
      preset: { ...(created.result as any), name: 'n2' },
    } as any);
    expect(upd.success).toBe(true);

    const fetched = await ctrl.get('p1');
    expect(fetched?.name).toBe('n2');

    const del = await ctrl.delete('p1');
    expect(del.success).toBe(true);

    const gone = await ctrl.get('p1');
    expect(gone).toBeNull();
  });
});
