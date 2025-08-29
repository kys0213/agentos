// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

@Controller()
export class GeneratedPresetController {

  @EventPattern('preset.list')
  async list() {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire preset.list');
  }

  @EventPattern('preset.get')
  async get(@Payload(new ZodValidationPipe(C.methods['get'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire preset.get');
  }

  @EventPattern('preset.create')
  async create(@Payload(new ZodValidationPipe(C.methods['create'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire preset.create');
  }

  @EventPattern('preset.update')
  async update(@Payload(new ZodValidationPipe(C.methods['update'].payload)) payload) {
    throw new Error('NotImplemented: wire preset.update');
  }

  @EventPattern('preset.delete')
  async delete(@Payload(new ZodValidationPipe(C.methods['delete'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire preset.delete');
  }
}
