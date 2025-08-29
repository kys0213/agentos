// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

@Controller()
export class GeneratedBridgeController {

  @EventPattern('bridge.register')
  async register(@Payload(new ZodValidationPipe(C.methods['register'].payload)) payload: z.input<typeof C.methods['register'].payload>) {
    throw new Error('NotImplemented: wire bridge.register');
  }

  @EventPattern('bridge.unregister')
  async unregister(@Payload(new ZodValidationPipe(C.methods['unregister'].payload)) payload: z.input<typeof C.methods['unregister'].payload>) {
    // Expected return: z.output<typeof C.methods['unregister'].response>
    throw new Error('NotImplemented: wire bridge.unregister');
  }

  @EventPattern('bridge.switch')
  async switch(@Payload(new ZodValidationPipe(C.methods['switch'].payload)) payload: z.input<typeof C.methods['switch'].payload>) {
    // Expected return: z.output<typeof C.methods['switch'].response>
    throw new Error('NotImplemented: wire bridge.switch');
  }

  @EventPattern('bridge.list')
  async list() {
    // Expected return: z.output<typeof C.methods['list'].response>
    throw new Error('NotImplemented: wire bridge.list');
  }
}
