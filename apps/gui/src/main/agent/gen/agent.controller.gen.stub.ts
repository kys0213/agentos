// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

@Controller()
export class GeneratedAgentControllerStub {
  @EventPattern('agent.chat')
  async chat(
    @Payload(new ZodValidationPipe(C.methods['chat']['payload']))
    payload: z.input<(typeof C.methods)['chat']['payload']>
  ): Promise<z.output<(typeof C.methods)['chat']['response']>> {
    // Expected return: z.output<typeof C.methods['chat']['response']>
    throw new Error('NotImplemented: wire agent.chat');
  }

  @EventPattern('agent.end-session')
  async end_session(
    @Payload(new ZodValidationPipe(C.methods['end-session']['payload']))
    payload: z.input<(typeof C.methods)['end-session']['payload']>
  ): Promise<void> {
    throw new Error('NotImplemented: wire agent.end-session');
  }

  @EventPattern('agent.get-metadata')
  async get_metadata(
    @Payload(new ZodValidationPipe(C.methods['get-metadata']['payload']))
    payload: z.input<(typeof C.methods)['get-metadata']['payload']>
  ): Promise<z.output<(typeof C.methods)['get-metadata']['response']>> {
    // Expected return: z.output<typeof C.methods['get-metadata']['response']>
    throw new Error('NotImplemented: wire agent.get-metadata');
  }

  @EventPattern('agent.get-all-metadatas')
  async get_all_metadatas(): Promise<
    z.output<(typeof C.methods)['get-all-metadatas']['response']>
  > {
    // Expected return: z.output<typeof C.methods['get-all-metadatas']['response']>
    throw new Error('NotImplemented: wire agent.get-all-metadatas');
  }

  @EventPattern('agent.update')
  async update(
    @Payload(new ZodValidationPipe(C.methods['update']['payload']))
    payload: z.input<(typeof C.methods)['update']['payload']>
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    // Expected return: z.output<typeof C.methods['update']['response']>
    throw new Error('NotImplemented: wire agent.update');
  }

  @EventPattern('agent.create')
  async create(
    @Payload(new ZodValidationPipe(C.methods['create']['payload']))
    payload: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<z.output<(typeof C.methods)['create']['response']>> {
    // Expected return: z.output<typeof C.methods['create']['response']>
    throw new Error('NotImplemented: wire agent.create');
  }

  @EventPattern('agent.delete')
  async delete(
    @Payload(new ZodValidationPipe(C.methods['delete']['payload']))
    payload: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    // Expected return: z.output<typeof C.methods['delete']['response']>
    throw new Error('NotImplemented: wire agent.delete');
  }
}
