// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { BridgeContract as C } from '../../../shared/rpc/contracts/bridge.contract';

@Controller()
export class GeneratedBridgeController {

  @EventPattern('bridge.register')
  async register(@Payload(new ZodValidationPipe(C.methods['register'].payload)) payload) {
    throw new Error('NotImplemented: wire bridge.register');
  }

  @EventPattern('bridge.unregister')
  async unregister(@Payload(new ZodValidationPipe(C.methods['unregister'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire bridge.unregister');
  }

  @EventPattern('bridge.switch')
  async switch(@Payload(new ZodValidationPipe(C.methods['switch'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire bridge.switch');
  }

  @EventPattern('bridge.get-current')
  async get_current() {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire bridge.get-current');
  }

  @EventPattern('bridge.list')
  async list() {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire bridge.list');
  }

  @EventPattern('bridge.get-config')
  async get_config(@Payload(new ZodValidationPipe(C.methods['get-config'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire bridge.get-config');
  }
}
