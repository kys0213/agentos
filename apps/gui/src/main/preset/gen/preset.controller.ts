import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';

// AUTO-GENERATED FILE. DO NOT EDIT.
@Controller()
export class GeneratedPresetController {
  @EventPattern('preset.list')
  async list(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.list to service');
  }

  @EventPattern('preset.get')
  async get(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.get to service');
  }

  @EventPattern('preset.create')
  async create(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.create to service');
  }

  @EventPattern('preset.update')
  async update(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.update to service');
  }

  @EventPattern('preset.delete')
  async remove(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.delete to service');
  }
}
