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

  @EventPattern('agent.end-session')
  async end_session(@Payload(new ZodValidationPipe(C.methods['end-session'].payload)) payload) {
    throw new Error('NotImplemented: wire agent.end-session');
  }

  @EventPattern('agent.get-metadata')
  async get_metadata(@Payload(new ZodValidationPipe(C.methods['get-metadata'].payload)) payload) {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire agent.get-metadata');
  }

  @EventPattern('agent.get-all-metadatas')
  async get_all_metadatas() {
    // Expected return shape matches contract response schema
    throw new Error('NotImplemented: wire agent.get-all-metadatas');
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
