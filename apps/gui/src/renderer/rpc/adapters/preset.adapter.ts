import type { Preset, CreatePreset, EnabledMcp } from '@agentos/core';
import type { z } from 'zod';
import { PresetClient } from '../gen/preset.client';
import { PresetContract as C, PresetSchema } from '../../../shared/rpc/contracts/preset.contract';

export class PresetServiceAdapter {
  constructor(private readonly client: PresetClient) {}

  private toPreset(p: z.output<typeof PresetSchema>): Preset {
    // 계약(응답)은 이미 zod.parse로 정규화됨. 어댑터에서 추가 기본값 주입 금지.
    // 코어 도메인에 필수인 값들이 누락되면 에러로 처리하여 상위에서 관리하도록 함.
    if (!p.llmBridgeName) {
      throw new Error('Invalid preset: llmBridgeName is missing');
    }
    if (!p.createdAt || !p.updatedAt) {
      throw new Error('Invalid preset: createdAt/updatedAt are required');
    }

    const enabledMcps: EnabledMcp[] = (p.enabledMcps ?? []).map((name) => ({
      name,
      enabledTools: [],
      enabledResources: [],
      enabledPrompts: [],
    }));

    return {
      id: p.id,
      name: p.name,
      description: p.description ?? '',
      author: p.author ?? '',
      version: p.version ?? '1.0.0',
      systemPrompt: p.systemPrompt ?? '',
      enabledMcps,
      llmBridgeName: p.llmBridgeName,
      llmBridgeConfig: p.llmBridgeConfig ?? {},
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      status: (p.status ?? 'active') as Preset['status'],
      category: p.category ?? ['general'],
      // 코어 전용(계약 외) 필드: 의미있는 기본값 제공
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    } satisfies Preset;
  }

  async getAllPresets(): Promise<Preset[]> {
    const page = await this.client.list();
    const items = await Promise.all(page.items.map(async (s) => this.client.get(s.id)));
    return items.filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => this.toPreset(p));
  }

  async createPreset(preset: CreatePreset): Promise<Preset> {
    // Map core CreatePreset → contract payload
    const payload = {
      name: preset.name,
      description: preset.description,
      author: preset.author,
      version: preset.version,
      systemPrompt: preset.systemPrompt,
      enabledMcps: (preset.enabledMcps ?? []).map((m) => m.name),
      llmBridgeName: preset.llmBridgeName,
      llmBridgeConfig: preset.llmBridgeConfig as Record<string, unknown>,
      status: preset.status,
      category: preset.category as string[] | undefined,
    } as z.input<(typeof C.methods)['create']['payload']>;
    const res = await this.client.create(payload);
    if (res.success && res.result) {
      return this.toPreset(res.result);
    }
    throw new Error(res.error ?? 'Failed to create preset');
  }

  async updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    const current = await this.client.get(id);
    if (!current) {
      throw new Error('Preset not found');
    }
    // Merge at core level for safety (patch may be core-shaped)
    const mergedCore: Preset = {
      ...this.toPreset(current),
      ...(patch as Partial<Preset>),
      id,
    } as Preset;
    const updatePayload: z.input<(typeof C.methods)['update']['payload']> = {
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
    };
    const res = await this.client.update(updatePayload);
    if (res.success && res.result) {
      return this.toPreset(res.result);
    }
    throw new Error(res.error ?? 'Failed to update preset');
  }

  async deletePreset(id: string): Promise<Preset> {
    // Best-effort: fetch then delete to satisfy return type
    const before = await this.client.get(id);
    await this.client.delete(id);
    // If not found, throw to respect API contract
    if (!before) {
      throw new Error('Preset not found');
    }
    return this.toPreset(before);
  }

  async getPreset(id: string): Promise<Preset | null> {
    const p = await this.client.get(id);
    return p ? this.toPreset(p) : null;
  }
}
