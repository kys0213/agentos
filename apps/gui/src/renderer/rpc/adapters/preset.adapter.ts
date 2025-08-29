import type { PresetProtocol } from '../../../shared/types/proset-protocol';
import type { Preset, CreatePreset } from '@agentos/core';
import { PresetClient } from '../gen/preset.client';

export class PresetServiceAdapter implements PresetProtocol {
  constructor(private readonly client: PresetClient) {}

  async getAllPresets(): Promise<Preset[]> {
    const page = await this.client.list();
    const items = await Promise.all(
      page.items.map(async (s) => this.client.get(s.id))
    );
    return items.filter((p): p is Preset => !!p);
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    const res = await this.client.create(preset as any);
    if (res.success && res.result) return res.result as Preset;
    throw new Error(res.error ?? 'Failed to create preset');
  }

  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const current = await this.client.get(id);
    if (!current) throw new Error('Preset not found');
    const merged: Preset = { ...current, ...patch, id } as Preset;
    const res = await this.client.update(id, merged as any);
    if (res.success && res.result) return res.result as Preset;
    throw new Error(res.error ?? 'Failed to update preset');
  }

  async deletePreset(id: string): Promise<Preset> {
    // Best-effort: fetch then delete to satisfy return type
    const before = await this.client.get(id);
    await this.client.delete(id);
    // If not found, throw to respect API contract
    if (!before) throw new Error('Preset not found');
    return before as Preset;
  }

  async getPreset(id: string): Promise<Preset | null> {
    const p = await this.client.get(id);
    return (p as Preset) ?? null;
  }
}

