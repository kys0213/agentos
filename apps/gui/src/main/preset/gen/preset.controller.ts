import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import type { z } from 'zod';
import { CreatePresetSchema, PresetSchema } from '../../../src/shared/rpc/contracts/preset.contract';

// AUTO-GENERATED FILE. DO NOT EDIT.
@Controller()
export class GeneratedPresetController {
  @EventPattern('preset.list')
  async list(@Payload() _payload: unknown) {
    throw new Error('NotImplemented: wire preset.list to service');
  }

  @EventPattern('preset.get')
  async get(@Payload() id: string) {
    throw new Error('NotImplemented: wire preset.get to service');
  }

  @EventPattern('preset.create')
  async create(
    @Payload(new ZodValidationPipe(CreatePresetSchema)) _payload: z.infer<typeof CreatePresetSchema>
  ) {
    throw new Error('NotImplemented: wire preset.create to service');
  }

  @EventPattern('preset.update')
  async update(
    @Payload() _payload: { id: string; preset: z.infer<typeof PresetSchema> }
  ) {
    throw new Error('NotImplemented: wire preset.update to service');
  }

  @EventPattern('preset.delete')
  async remove(@Payload() id: string) {
    throw new Error('NotImplemented: wire preset.delete to service');
  }
}
