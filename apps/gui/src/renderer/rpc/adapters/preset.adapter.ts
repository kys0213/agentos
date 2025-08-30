import type { Preset, CreatePreset, EnabledMcp } from '@agentos/core';
import type { z } from 'zod';
import { PresetClient } from '../gen/preset.client';
import { PresetContract as C, PresetSchema } from '../../../shared/rpc/contracts/preset.contract';

export class PresetServiceAdapter {
  constructor(private readonly client: PresetClient) {}

  private toPreset(p: z.infer<typeof PresetSchema>): Preset {
    const base = p as Record<string, unknown>;
    const enabledMcpsFromContract = Array.isArray(base.enabledMcps)
      ? (base.enabledMcps as string[])
      : [];
    const enabledMcps: EnabledMcp[] = enabledMcpsFromContract.map((name) => ({
      name,
      enabledTools: [],
      enabledResources: [],
      enabledPrompts: [],
    }));
    return {
      id: base.id as string,
      name: (base.name as string) ?? '',
      description: (base.description as string | undefined) ?? '',
      author: (base.author as string | undefined) ?? '',
      version: (base.version as string | undefined) ?? '1.0.0',
      systemPrompt: (base.systemPrompt as string | undefined) ?? '',
      enabledMcps,
      llmBridgeName: (base.llmBridgeName as string | undefined) ?? 'default',
      llmBridgeConfig: (base.llmBridgeConfig as Record<string, unknown> | undefined) ?? {},
      createdAt: (base.createdAt as Date | undefined) ?? new Date(),
      updatedAt: (base.updatedAt as Date | undefined) ?? new Date(),
      status: ((base.status as string | undefined) ?? 'active') as Preset['status'],
      category: (base.category as string[] | undefined) ?? ['general'],
      // UI/analytics friendly defaults (domain 타입 내 정의됨)
      usageCount: (base.usageCount as number | undefined) ?? 0,
      knowledgeDocuments: (base.knowledgeDocuments as number | undefined) ?? 0,
      knowledgeStats: (base.knowledgeStats as Preset['knowledgeStats'] | undefined) ?? {
        indexed: 0,
        vectorized: 0,
        totalSize: 0,
      },
    } satisfies Preset;
  }

  async getAllPresets(): Promise<Preset[]> {
    const page = C.methods['list'].response.parse(await this.client.list());
    const items = await Promise.all(
      page.items.map(async (s) => C.methods['get'].response.parse(await this.client.get(s.id)))
    );
    return items.filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => this.toPreset(p));
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    // Map core CreatePreset → contract payload
    const payload = C.methods['create'].payload.parse({
      name: preset.name,
      description: preset.description,
      author: preset.author,
      version: preset.version,
      systemPrompt: preset.systemPrompt,
      enabledMcps: (preset.enabledMcps ?? []).map((m) => m.name),
      llmBridgeName: preset.llmBridgeName,
      llmBridgeConfig: preset.llmBridgeConfig as Record<string, unknown>,
      status: preset.status as unknown as string | undefined,
      category: preset.category as string[] | undefined,
    });
    const res = C.methods['create'].response.parse(await this.client.create(payload));
    if (res.success && res.result) {
      return this.toPreset(res.result);
    }
    throw new Error(res.error ?? 'Failed to create preset');
  }

  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const current = C.methods['get'].response.parse(await this.client.get(id));
    if (!current) {
      throw new Error('Preset not found');
    }
    // Merge at core level for safety (patch may be core-shaped)
    const mergedCore: Preset = {
      ...this.toPreset(current),
      ...(patch as Partial<Preset>),
      id,
    } as Preset;
    const updatePayload = C.methods['update'].payload.parse({
      id,
      preset: {
        id: mergedCore.id,
        name: mergedCore.name,
        description: mergedCore.description,
        author: mergedCore.author,
        version: mergedCore.version,
        systemPrompt: mergedCore.systemPrompt,
        enabledMcps: (mergedCore.enabledMcps ?? []).map((m) => m.name),
        llmBridgeName: mergedCore.llmBridgeName,
        llmBridgeConfig: mergedCore.llmBridgeConfig as Record<string, unknown>,
        status: mergedCore.status,
        category: mergedCore.category,
        createdAt: mergedCore.createdAt,
        updatedAt: mergedCore.updatedAt,
      },
    });
    const res = C.methods['update'].response.parse(await this.client.update(updatePayload));
    if (res.success && res.result) {
      return this.toPreset(res.result);
    }
    throw new Error(res.error ?? 'Failed to update preset');
  }

  async deletePreset(id: string): Promise<Preset> {
    // Best-effort: fetch then delete to satisfy return type
    const before = C.methods['get'].response.parse(await this.client.get(id));
    await this.client.delete(id);
    // If not found, throw to respect API contract
    if (!before) {
      throw new Error('Preset not found');
    }
    return this.toPreset(before);
  }

  async getPreset(id: string): Promise<Preset | null> {
    const p = C.methods['get'].response.parse(await this.client.get(id));
    return p ? this.toPreset(p) : null;
  }
}
