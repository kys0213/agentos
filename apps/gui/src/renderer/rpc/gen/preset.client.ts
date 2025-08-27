import type { RpcClient } from '../../../shared/rpc/transport';
import { Channels } from '../../../shared/rpc/gen/channels';
import type { CursorPaginationResult } from '@agentos/core';
import type { z } from 'zod';
import {
  PresetSchema,
  PresetSummarySchema,
  CreatePresetSchema,
} from '../../../shared/rpc/contracts/preset.contract';

type Preset = z.infer<typeof PresetSchema>;
type PresetSummary = z.infer<typeof PresetSummarySchema>;
type CreatePreset = z.infer<typeof CreatePresetSchema>;

/** AUTO-GENERATED FILE. DO NOT EDIT. */
export class PresetClient {
  constructor(private readonly transport: RpcClient) {}

  list(): Promise<CursorPaginationResult<PresetSummary>> {
    return this.transport.request(Channels.preset.list);
  }

  get(id: string): Promise<Preset | null> {
    return this.transport.request(Channels.preset.get, id);
  }

  create(preset: CreatePreset): Promise<{ success: boolean; result?: Preset; error?: string }> {
    return this.transport.request(Channels.preset.create, preset);
  }

  update(
    id: string,
    preset: Preset
  ): Promise<{ success: boolean; result?: Preset; error?: string }> {
    return this.transport.request(Channels.preset.update, { id, preset });
  }

  delete(id: string): Promise<{ success: boolean; error?: string }> {
    return this.transport.request(Channels.preset.delete, id);
  }
}
