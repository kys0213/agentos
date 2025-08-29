// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

@Controller()
export class GeneratedAgentController {

  @EventPattern('agent.chat')
  async chat(@Payload(new ZodValidationPipe(C.methods['chat'].payload)) payload) {
    throw new Error('NotImplemented: wire agent.chat');
  }

  @EventPattern('agent.update')
  async update(@Payload(new ZodValidationPipe(C.methods['update'].payload)) payload) {
    throw new Error('NotImplemented: wire agent.update');
  }

  @EventPattern('agent.create')
  async create(@Payload(new ZodValidationPipe(C.methods['create'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire agent.create');
  }

  @EventPattern('agent.delete')
  async delete(@Payload(new ZodValidationPipe(C.methods['delete'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire agent.delete');
  }
}
