import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

// AUTO-GENERATED FILE. DO NOT EDIT.
@Controller()
export class GeneratedBridgeController {
  @EventPattern('bridge.register')
  async register(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.register');
  }
  @EventPattern('bridge.unregister')
  async unregister(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.unregister');
  }
  @EventPattern('bridge.switch')
  async switch(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.switch');
  }
  @EventPattern('bridge.get-current')
  async getCurrent(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.get-current');
  }
  @EventPattern('bridge.list')
  async list(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.list');
  }
  @EventPattern('bridge.get-config')
  async getConfig(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire bridge.get-config');
  }
}
