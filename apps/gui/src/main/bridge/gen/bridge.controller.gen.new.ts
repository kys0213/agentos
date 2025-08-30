// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';
import type { LlmBridgeRegistry } from '@agentos/core';
import { LLM_BRIDGE_REGISTRY_TOKEN } from '../../common/model/constants';

@Controller()
export class GeneratedBridgeController {
  constructor(@Inject(LLM_BRIDGE_REGISTRY_TOKEN) private readonly registry: LlmBridgeRegistry) {}

  @EventPattern('bridge.register')
  async register(
    @Payload(new ZodValidationPipe(C.methods['register']['payload']))
    payload: z.input<(typeof C.methods)['register']['payload']>
  ): Promise<z.output<(typeof C.methods)['register']['response']>> {
    try {
      const id = await this.registry.register(
        payload.manifest as any,
        (payload.config ?? {}) as Record<string, unknown>,
        payload.id ? { id: payload.id } : undefined
      );
      return { success: true, id };
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) } as any;
    }
  }

  @EventPattern('bridge.unregister')
  async unregister(
    @Payload(new ZodValidationPipe(C.methods['unregister']['payload']))
    payload: z.input<(typeof C.methods)['unregister']['payload']>
  ): Promise<z.output<(typeof C.methods)['unregister']['response']>> {
    try {
      await this.registry.unregister(payload);
      return { success: true } as any;
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) } as any;
    }
  }

  @EventPattern('bridge.switch')
  async switch(
    @Payload(new ZodValidationPipe(C.methods['switch']['payload']))
    payload: z.input<(typeof C.methods)['switch']['payload']>
  ): Promise<z.output<(typeof C.methods)['switch']['response']>> {
    try {
      await this.registry.setActiveId(payload);
      return { success: true } as any;
    } catch (e: unknown) {
      return { success: false, error: e instanceof Error ? e.message : String(e) } as any;
    }
  }

  @EventPattern('bridge.get-current')
  async get_current(): Promise<z.output<(typeof C.methods)['get-current']['response']>> {
    const id = await this.registry.getActiveId();
    if (!id) {
      return null;
    }
    const manifest = await this.registry.getManifest(id);
    return manifest ? ({ id, manifest } as any) : null;
  }

  @EventPattern('bridge.list')
  async list(): Promise<z.output<(typeof C.methods)['list']['response']>> {
    const list = await this.registry.listSummaries();
    return list.map((x) => ({ id: x.id })) as any;
  }

  @EventPattern('bridge.get-config')
  async get_config(
    @Payload(new ZodValidationPipe(C.methods['get-config']['payload']))
    payload: z.input<(typeof C.methods)['get-config']['payload']>
  ): Promise<z.output<(typeof C.methods)['get-config']['response']>> {
    const cfg = await this.registry.getManifest(payload);
    return (cfg as any) ?? null;
  }
}
