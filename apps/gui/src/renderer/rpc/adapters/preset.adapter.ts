import type { Preset, CreatePreset } from '@agentos/core';
import { PresetClient } from '../gen/preset.client';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

export class PresetServiceAdapter {
  constructor(private readonly client: PresetClient) {}

  private toPreset(p: Partial<Preset> | null): Preset {
    const base = (p ?? {}) as Partial<Preset>;
    return {
      id: base.id ?? `preset-${Date.now()}`,
      name: base.name ?? '',
      description: base.description ?? '',
      author: base.author ?? '',
      version: base.version ?? '1.0.0',
      systemPrompt: base.systemPrompt ?? '',
      enabledMcps: base.enabledMcps ?? [],
      llmBridgeName: base.llmBridgeName ?? 'default',
      llmBridgeConfig: base.llmBridgeConfig ?? {},
      createdAt: base.createdAt ?? new Date(),
      updatedAt: base.updatedAt ?? new Date(),
      status: base.status ?? 'active',
      category: base.category ?? ['general'],
      // UI/analytics friendly defaults (domain 타입 내 정의됨)
      usageCount: base.usageCount ?? 0,
      knowledgeDocuments: base.knowledgeDocuments ?? 0,
      knowledgeStats:
        base.knowledgeStats ?? ({ indexed: 0, vectorized: 0, totalSize: 0 } as const),
    } satisfies Preset;
  }

  async getAllPresets(): Promise<Preset[]> {
    const page = C.methods['list'].response.parse(await this.client.list());
    const items = await Promise.all(
      page.items.map(async (s) => C.methods['get'].response.parse(await this.client.get(s.id)))
    );
    return items.filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => this.toPreset(p as any));
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    const res = C.methods['create'].response.parse(await this.client.create(preset));
    if (res.success && res.result) return this.toPreset(res.result as any);
    throw new Error(res.error ?? 'Failed to create preset');
  }

  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const current = C.methods['get'].response.parse(await this.client.get(id));
    if (!current) throw new Error('Preset not found');
    const merged: Preset = this.toPreset({ ...current, ...patch, id });
    const res = C.methods['update'].response.parse(await this.client.update({ id, preset: merged }));
    if (res.success && res.result) return this.toPreset(res.result as any);
    throw new Error(res.error ?? 'Failed to update preset');
  }

  async deletePreset(id: string): Promise<Preset> {
    // Best-effort: fetch then delete to satisfy return type
    const before = C.methods['get'].response.parse(await this.client.get(id));
    await this.client.delete(id);
    // If not found, throw to respect API contract
    if (!before) throw new Error('Preset not found');
    return this.toPreset(before);
  }

  async getPreset(id: string): Promise<Preset | null> {
    const p = C.methods['get'].response.parse(await this.client.get(id));
    return p ? this.toPreset(p) : null;
  }
}
