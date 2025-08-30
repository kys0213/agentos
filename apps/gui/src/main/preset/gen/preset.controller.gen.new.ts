// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';
import type { CreatePreset, EnabledMcp, Preset, PresetRepository } from '@agentos/core';
import { PRESET_REPOSITORY_TOKEN } from '../../common/preset/constants';

@Controller()
export class GeneratedPresetController {
  constructor(@Inject(PRESET_REPOSITORY_TOKEN) private readonly repo: PresetRepository) {}

  @EventPattern('preset.list')
  async list(): Promise<z.output<(typeof C.methods)['list']['response']>> {
    return this.repo.list();
  }

  @EventPattern('preset.get')
  async get(
    @Payload(new ZodValidationPipe(C.methods['get']['payload']))
    payload: z.input<(typeof C.methods)['get']['payload']>
  ): Promise<z.output<(typeof C.methods)['get']['response']>> {
    const p = await this.repo.get(payload);
    return p ? this.toContract(p) : null;
  }

  @EventPattern('preset.create')
  async create(
    @Payload(new ZodValidationPipe(C.methods['create']['payload']))
    payload: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<z.output<(typeof C.methods)['create']['response']>> {
    return this.safe(async () =>
      this.toContract(await this.repo.create(this.fromContractCreate(payload)))
    );
  }

  @EventPattern('preset.update')
  async update(
    @Payload(new ZodValidationPipe(C.methods['update']['payload']))
    payload: z.input<(typeof C.methods)['update']['payload']>
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    return this.safe(async () =>
      this.toContract(await this.repo.update(payload.id, this.fromContract(payload.preset)))
    );
  }

  @EventPattern('preset.delete')
  async delete(
    @Payload(new ZodValidationPipe(C.methods['delete']['payload']))
    payload: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    try {
      await this.repo.delete(payload);
      return { success: true };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  private async safe<T>(
    fn: () => Promise<T>
  ): Promise<{ success: true; result: T } | { success: false; error: string }> {
    try {
      return { success: true, result: await fn() };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // Contract <-> Core mappers
  private toContract(p: Preset) {
    return {
      id: p.id,
      name: p.name,
      description: p.description,
      author: p.author,
      version: p.version,
      systemPrompt: p.systemPrompt,
      enabledMcps: (p.enabledMcps ?? []).map((m) => m.name),
      llmBridgeName: p.llmBridgeName,
      llmBridgeConfig: p.llmBridgeConfig,
      status: p.status,
      category: p.category,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    } satisfies z.output<(typeof C.methods)['get']['response']> extends infer R
      ? R extends object
        ? R
        : never
      : never;
  }

  private fromContractCreate(c: z.input<(typeof C.methods)['create']['payload']>): CreatePreset {
    const enabledMcps: EnabledMcp[] | undefined = c.enabledMcps
      ? c.enabledMcps.map((name) => ({
          name,
          enabledTools: [],
          enabledResources: [],
          enabledPrompts: [],
        }))
      : undefined;
    return {
      name: c.name,
      description: c.description ?? '',
      author: c.author ?? '',
      version: c.version ?? '1.0.0',
      systemPrompt: c.systemPrompt,
      enabledMcps,
      llmBridgeName: c.llmBridgeName!,
      llmBridgeConfig: c.llmBridgeConfig ?? {},
      status: (c.status as Preset['status']) ?? 'active',
      category: c.category ?? ['general'],
    };
  }

  private fromContract(c: z.input<(typeof C.methods)['update']['payload']>['preset']): Preset {
    const enabledMcps: EnabledMcp[] | undefined = c.enabledMcps
      ? (c.enabledMcps as string[]).map((name) => ({
          name,
          enabledTools: [],
          enabledResources: [],
          enabledPrompts: [],
        }))
      : undefined;
    return {
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      author: c.author ?? '',
      version: c.version ?? '1.0.0',
      systemPrompt: c.systemPrompt ?? '',
      enabledMcps,
      llmBridgeName: c.llmBridgeName ?? 'default',
      llmBridgeConfig: c.llmBridgeConfig ?? {},
      status: (c.status as Preset['status']) ?? 'active',
      category: c.category ?? ['general'],
      createdAt: (c.createdAt as Date) ?? new Date(),
      updatedAt: (c.updatedAt as Date) ?? new Date(),
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    };
  }
}
