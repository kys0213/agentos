import type { RpcClient } from '../../../shared/rpc/transport';
import type { CreatePreset, Preset, PresetSummary } from '@agentos/core';
import type { CursorPaginationResult } from '@agentos/core';

export class PresetRpcService {
  constructor(private readonly transport: RpcClient) {}

  // New API (Nest controller channels)
  listSummaries(): Promise<CursorPaginationResult<PresetSummary>> {
    return this.transport.request('preset.list');
  }

  get(id: string): Promise<Preset | null> {
    return this.transport.request('preset.get', id);
  }

  create(preset: CreatePreset): Promise<{ success: boolean; result?: Preset; error?: string }> {
    return this.transport.request('preset.create', preset);
  }

  update(id: string, preset: Preset): Promise<{ success: boolean; result?: Preset; error?: string }> {
    return this.transport.request('preset.update', { id, preset });
  }

  remove(id: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request('preset.delete', id);
  }

  async getOrThrow(id: string): Promise<Preset> {
    const preset = await this.get(id);

    if (!preset) {
      throw new Error(`Preset not found: ${id}`);
    }

    return preset;
  }

  // Backward-compatible API (delegates to controller channels)
  async getAllPresets(): Promise<Preset[]> {
    const page = await this.listSummaries();
    const items = await Promise.all(page.items.map((s) => this.get(s.id)));
    return items.filter(Boolean) as Preset[];
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    const param: CreatePreset = {
      name: preset.name,
      description: preset.description,
      author: preset.author,
      version: preset.version ?? '1.0.0',
      systemPrompt: preset.systemPrompt,
      enabledMcps: preset.enabledMcps ?? [],
      llmBridgeName: preset.llmBridgeName,
      llmBridgeConfig: preset.llmBridgeConfig ?? {},
      status: preset.status ?? 'active',
      category: preset.category ?? ['general'],
    };

    const res = await this.create(param);

    if (!res.success) {
      throw new Error(res.error || 'Failed to create preset');
    }

    const got = await this.getOrThrow((res as any).result?.id ?? '');

    return got;
  }
  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const existing = await this.getOrThrow(id);

    const next: Preset = { ...existing, ...patch, updatedAt: new Date() };

    const res = await this.update(id, next);

    if (!res.success) throw new Error(res.error || 'Failed to update preset');

    const got = await this.getOrThrow(id);

    return got;
  }

  async deletePreset(id: string): Promise<Preset> {
    const existing = await this.getOrThrow(id);

    const res = await this.remove(id);

    if (!res.success) {
      throw new Error(res.error || 'Failed to delete preset');
    }

    return existing;
  }

  getPreset(id: string): Promise<Preset | null> {
    return this.get(id);
  }
}
