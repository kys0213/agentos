// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import type { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

@Controller()
export class GeneratedAgentController {

  @EventPattern('agent.chat')
  async chat(@Payload(new ZodValidationPipe(C.methods['chat'].payload)) payload: z.input<typeof C.methods['chat'].payload>) {
    throw new Error('NotImplemented: wire agent.chat');
  }

  @EventPattern('agent.update')
  async update(@Payload(new ZodValidationPipe(C.methods['update'].payload)) payload: z.input<typeof C.methods['update'].payload>) {
    throw new Error('NotImplemented: wire agent.update');
  }

  @EventPattern('agent.create')
  async create(@Payload(new ZodValidationPipe(C.methods['create'].payload)) payload: z.input<typeof C.methods['create'].payload>) {
    // Expected return: z.output<typeof C.methods['create'].response>
    throw new Error('NotImplemented: wire agent.create');
  }

  @EventPattern('agent.delete')
  async delete(@Payload(new ZodValidationPipe(C.methods['delete'].payload)) payload: z.input<typeof C.methods['delete'].payload>) {
    // Expected return: z.output<typeof C.methods['delete'].response>
    throw new Error('NotImplemented: wire agent.delete');
  }
}
