import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { LlmManifest } from 'llm-bridge-spec';
import type { LlmBridgeRegistry } from '@agentos/core';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../common/model/constants';

type RegisterPayload = { manifest: LlmManifest; config: Record<string, unknown>; id?: string };

@Controller()
export class BridgeController {
  constructor(@Inject(LLM_BRIDGE_REGISTRY_TOKEN) private readonly registry: LlmBridgeRegistry) {}

  @EventPattern('bridge.list')
  list() {
    return this.registry.listSummaries();
  }

  @EventPattern('bridge.get-current')
  async getCurrent() {
    const id = await this.registry.getActiveId();
    if (!id) return null;
    const manifest = await this.registry.getManifest(id);
    return manifest ? { id, manifest } : null;
  }

  @EventPattern('bridge.get-config')
  getConfig(@Payload() id: string) {
    return this.registry.getManifest(id);
  }

  @EventPattern('bridge.register')
  async register(@Payload() data: RegisterPayload) {
    // Assumes loader has already loaded the manifest by name in app bootstrap or via a prior call.
    const id = await this.registry.register(data.manifest, data.config as Record<string, unknown>, {
      id: data.id,
    });
    return { id };
  }

  @EventPattern('bridge.unregister')
  async unregister(@Payload() id: string) {
    await this.registry.unregister(id);
    return { success: true };
  }

  @EventPattern('bridge.switch')
  async switchActive(@Payload() id: string) {
    await this.registry.setActiveId(id);
    return { success: true };
  }
}
