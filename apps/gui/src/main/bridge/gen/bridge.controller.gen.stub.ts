// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

@Controller()
export class GeneratedBridgeControllerStub {
  @EventPattern('bridge.register')
  async register(
    @Payload(new ZodValidationPipe(C.methods['register']['payload']))
    payload: z.input<(typeof C.methods)['register']['payload']>
  ): Promise<z.output<(typeof C.methods)['register']['response']>> {
    // Expected return: z.output<typeof C.methods['register']['response']>
    throw new Error('NotImplemented: wire bridge.register');
  }

  @EventPattern('bridge.unregister')
  async unregister(
    @Payload(new ZodValidationPipe(C.methods['unregister']['payload']))
    payload: z.input<(typeof C.methods)['unregister']['payload']>
  ): Promise<z.output<(typeof C.methods)['unregister']['response']>> {
    // Expected return: z.output<typeof C.methods['unregister']['response']>
    throw new Error('NotImplemented: wire bridge.unregister');
  }

  @EventPattern('bridge.switch')
  async switch(
    @Payload(new ZodValidationPipe(C.methods['switch']['payload']))
    payload: z.input<(typeof C.methods)['switch']['payload']>
  ): Promise<z.output<(typeof C.methods)['switch']['response']>> {
    // Expected return: z.output<typeof C.methods['switch']['response']>
    throw new Error('NotImplemented: wire bridge.switch');
  }

  @EventPattern('bridge.get-current')
  async get_current(): Promise<z.output<(typeof C.methods)['get-current']['response']>> {
    // Expected return: z.output<typeof C.methods['get-current']['response']>
    throw new Error('NotImplemented: wire bridge.get-current');
  }

  @EventPattern('bridge.list')
  async list(): Promise<z.output<(typeof C.methods)['list']['response']>> {
    // Expected return: z.output<typeof C.methods['list']['response']>
    throw new Error('NotImplemented: wire bridge.list');
  }

  @EventPattern('bridge.get-config')
  async get_config(
    @Payload(new ZodValidationPipe(C.methods['get-config']['payload']))
    payload: z.input<(typeof C.methods)['get-config']['payload']>
  ): Promise<z.output<(typeof C.methods)['get-config']['response']>> {
    // Expected return: z.output<typeof C.methods['get-config']['response']>
    throw new Error('NotImplemented: wire bridge.get-config');
  }
}
