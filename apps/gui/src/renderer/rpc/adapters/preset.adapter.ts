import type { Preset, CreatePreset } from '@agentos/core';
import { PresetClient } from '../gen/preset.client';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

export class PresetServiceAdapter {
  constructor(private readonly client: PresetClient) {}

  private toPreset(p: any): Preset {
    return {
      usageCount: 0,
      knowledgeDocuments: 0 as any,
      knowledgeStats: {} as any,
      ...(p as any),
    } as Preset;
  }

  async getAllPresets(): Promise<Preset[]> {
    const page = C.methods['list'].response.parse(await this.client.list());
    const items = await Promise.all(page.items.map(async (s) => this.client.get(s.id)));
    return items.filter(Boolean).map((p) => this.toPreset(p));
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    const res = C.methods['create'].response.parse(await this.client.create(preset as any));
    if (res.success && (res as any).result) return this.toPreset((res as any).result);
    throw new Error(res.error ?? 'Failed to create preset');
  }

  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const current = await this.client.get(id);
    if (!current) throw new Error('Preset not found');
    const merged: Preset = {
      usageCount: 0,
      knowledgeDocuments: [],
      knowledgeStats: {},
      ...(current as any),
      ...(patch as any),
      id,
    } as Preset;
    const res = C.methods['update'].response.parse(
      await this.client.update({ id, preset: merged as any })
    );
    if (res.success && (res as any).result) return this.toPreset((res as any).result);
    throw new Error(res.error ?? 'Failed to update preset');
  }

  async deletePreset(id: string): Promise<Preset> {
    // Best-effort: fetch then delete to satisfy return type
    const before = await this.client.get(id);
    await this.client.delete(id);
    // If not found, throw to respect API contract
    if (!before) throw new Error('Preset not found');
    return this.toPreset(before);
  }

  async getPreset(id: string): Promise<Preset | null> {
    const p = await this.client.get(id);
    return p ? this.toPreset(p) : null;
  }
}
