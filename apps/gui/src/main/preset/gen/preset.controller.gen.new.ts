// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { PresetContract as C } from '../../../shared/rpc/contracts/preset.contract';

@Controller()
export class GeneratedPresetController {

  @EventPattern('preset.list')
  async list(): Promise<z.output<typeof C.methods['list'].response>> {
    // Expected return: z.output<typeof C.methods['list'].response>
    throw new Error('NotImplemented: wire preset.list');
  }

  @EventPattern('preset.get')
  async get(@Payload(new ZodValidationPipe(C.methods['get'].payload)) payload: z.input<typeof C.methods['get'].payload>): Promise<z.output<typeof C.methods['get'].response>> {
    // Expected return: z.output<typeof C.methods['get'].response>
    throw new Error('NotImplemented: wire preset.get');
  }

  @EventPattern('preset.create')
  async create(@Payload(new ZodValidationPipe(C.methods['create'].payload)) payload: z.input<typeof C.methods['create'].payload>): Promise<z.output<typeof C.methods['create'].response>> {
    // Expected return: z.output<typeof C.methods['create'].response>
    throw new Error('NotImplemented: wire preset.create');
  }

  @EventPattern('preset.update')
  async update(@Payload(new ZodValidationPipe(C.methods['update'].payload)) payload: z.input<typeof C.methods['update'].payload>): Promise<z.output<typeof C.methods['update'].response>> {
    // Expected return: z.output<typeof C.methods['update'].response>
    throw new Error('NotImplemented: wire preset.update');
  }

  @EventPattern('preset.delete')
  async delete(@Payload(new ZodValidationPipe(C.methods['delete'].payload)) payload: z.input<typeof C.methods['delete'].payload>): Promise<z.output<typeof C.methods['delete'].response>> {
    // Expected return: z.output<typeof C.methods['delete'].response>
    throw new Error('NotImplemented: wire preset.delete');
  }
}
