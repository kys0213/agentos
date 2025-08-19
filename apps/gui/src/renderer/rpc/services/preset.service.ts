import type { RpcTransport } from '../../../shared/rpc/transport';
import type { CreatePreset, Preset, PresetSummary } from '@agentos/core';
import type { CursorPaginationResult } from '@agentos/core';

export class PresetRpcService {
  constructor(private readonly transport: RpcTransport) {}

  // New API (Nest controller channels)
  listSummaries(): Promise<CursorPaginationResult<PresetSummary>> {
    return this.transport.request('preset.list');
  }
  get(id: string): Promise<Preset | null> {
    return this.transport.request('preset.get', id);
  }
  create(preset: Preset): Promise<{ success: boolean; error?: string }> {
    return this.transport.request('preset.create', preset);
  }
  update(id: string, preset: Preset): Promise<{ success: boolean; error?: string }> {
    return this.transport.request('preset.update', { id, preset });
  }
  remove(id: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request('preset.delete', id);
  }

  // Backward-compatible API (delegates to controller channels)
  async getAllPresets(): Promise<Preset[]> {
    const page = await this.listSummaries();
    const items = await Promise.all(page.items.map((s) => this.get(s.id)));
    return (items.filter(Boolean) as Preset[]);
  }
  async createPreset(preset: CreatePreset): Promise<Preset> {
    const now = new Date();
    const full: Preset = {
      // id는 호출 측에서 제공하거나 컨트롤러가 보장해야 함. 여기서는 임시 생성 방지 → 컨트롤러가 write 수행
      id: (preset as any).id ?? `p_${Date.now().toString(36)}`,
      name: preset.name,
      description: preset.description,
      author: preset.author,
      createdAt: now,
      updatedAt: now,
      version: preset.version ?? '1.0.0',
      systemPrompt: preset.systemPrompt,
      enabledMcps: preset.enabledMcps ?? [],
      llmBridgeName: preset.llmBridgeName,
      llmBridgeConfig: preset.llmBridgeConfig ?? {},
      status: preset.status ?? 'active',
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: preset.knowledgeStats ?? { indexed: 0, vectorized: 0, totalSize: 0 },
      category: preset.category ?? ['general'],
    } as Preset;
    const res = await this.create(full);
    if (!res.success) throw new Error(res.error || 'Failed to create preset');
    const got = await this.get(full.id);
    return got as Preset;
  }
  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const existing = await this.get(id);
    if (!existing) throw new Error(`Preset not found: ${id}`);
    const next: Preset = { ...existing, ...patch, updatedAt: new Date() } as Preset;
    const res = await this.update(id, next);
    if (!res.success) throw new Error(res.error || 'Failed to update preset');
    const got = await this.get(id);
    return got as Preset;
  }
  async deletePreset(id: string): Promise<Preset> {
    const existing = await this.get(id);
    const res = await this.remove(id);
    if (!res.success) throw new Error(res.error || 'Failed to delete preset');
    return existing as Preset;
  }
  getPreset(id: string): Promise<Preset | null> {
    return this.get(id);
  }
}
