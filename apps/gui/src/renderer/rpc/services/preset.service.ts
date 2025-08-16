import type { RpcTransport } from '../../../shared/rpc/transport';
import type { CreatePreset, Preset } from '@agentos/core';

export class PresetRpcService {
  constructor(private readonly transport: RpcTransport) {}

  getAllPresets(): Promise<Preset[]> {
    return this.transport.request('preset:get-all');
  }
  createPreset(preset: CreatePreset): Promise<Preset> {
    return this.transport.request('preset:create', preset);
  }
  updatePreset(id: string, patch: Partial<Omit<Preset, 'id'>>): Promise<Preset> {
    return this.transport.request('preset:update', { id, patch });
  }
  deletePreset(id: string): Promise<Preset> {
    return this.transport.request('preset:delete', id);
  }
  getPreset(id: string): Promise<Preset | null> {
    return this.transport.request('preset:get', id);
  }
}
