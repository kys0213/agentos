import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { LlmBridgeRegistry } from '@agentos/core';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../common/model/constants';
import { RegisterBridgeDto, type Resp } from './dto/bridge.dto';

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
    if (!id) {
      return null;
    }
    const manifest = await this.registry.getManifest(id);
    return manifest ? { id, manifest } : null;
  }

  @EventPattern('bridge.get-config')
  getConfig(@Payload() id: string) {
    return this.registry.getManifest(id);
  }

  @EventPattern('bridge.register')
  async register(@Payload() data: RegisterBridgeDto): Promise<Resp<{ id: string }>> {
    try {
      const id = await this.registry.register(
        data.manifest,
        data.config as Record<string, unknown>,
        { id: data.id }
      );
      return { success: true, result: { id } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  @EventPattern('bridge.unregister')
  async unregister(@Payload() id: string): Promise<Resp<{ success: true }>> {
    try {
      await this.registry.unregister(id);
      return { success: true, result: { success: true } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  @EventPattern('bridge.switch')
  async switchActive(@Payload() id: string): Promise<Resp<{ success: true }>> {
    try {
      await this.registry.setActiveId(id);
      return { success: true, result: { success: true } };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) };
    }
  }
}
