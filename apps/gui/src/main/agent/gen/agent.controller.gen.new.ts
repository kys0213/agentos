// AUTO-GENERATED FILE. DO NOT EDIT.
import { Controller, Inject } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';
import { AgentSessionService } from '../agent.service';
import type { AgentMetadata, CreateAgentMetadata, AgentExecuteOptions } from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';

@Controller()
export class GeneratedAgentController {
  constructor(private readonly svc: AgentSessionService) {}

  @EventPattern('agent.chat')
  async chat(
    @Payload(new ZodValidationPipe(C.methods['chat']['payload']))
    payload: z.input<(typeof C.methods)['chat']['payload']>
  ): Promise<z.output<(typeof C.methods)['chat']['response']>> {
    const { agentId, messages, options } = payload;
    return this.svc.chat(
      agentId,
      messages as unknown as UserMessage[],
      options as unknown as AgentExecuteOptions
    );
  }

  @EventPattern('agent.end-session')
  async end_session(
    @Payload(new ZodValidationPipe(C.methods['end-session']['payload']))
    payload: z.input<(typeof C.methods)['end-session']['payload']>
  ): Promise<void> {
    const { agentId, sessionId } = payload;
    await this.svc.endSession(agentId, sessionId);
  }

  @EventPattern('agent.get-metadata')
  async get_metadata(
    @Payload(new ZodValidationPipe(C.methods['get-metadata']['payload']))
    payload: z.input<(typeof C.methods)['get-metadata']['payload']>
  ): Promise<z.output<(typeof C.methods)['get-metadata']['response']>> {
    const res = await this.svc.getMetadata(payload);
    return res as unknown as z.output<(typeof C.methods)['get-metadata']['response']>;
  }

  @EventPattern('agent.get-all-metadatas')
  async get_all_metadatas(): Promise<
    z.output<(typeof C.methods)['get-all-metadatas']['response']>
  > {
    const page = await this.svc.getAllMetadatas();
    return page.items as unknown as z.output<(typeof C.methods)['get-all-metadatas']['response']>;
  }

  @EventPattern('agent.update')
  async update(
    @Payload(new ZodValidationPipe(C.methods['update']['payload']))
    payload: z.input<(typeof C.methods)['update']['payload']>
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    const { agentId, patch } = payload;
    const updated = await this.svc.updateAgent(
      agentId,
      patch as unknown as Partial<Omit<AgentMetadata, 'id'>>
    );
    return updated as unknown as z.output<(typeof C.methods)['update']['response']>;
  }

  @EventPattern('agent.create')
  async create(
    @Payload(new ZodValidationPipe(C.methods['create']['payload']))
    payload: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<z.output<(typeof C.methods)['create']['response']>> {
    const created = await this.svc.createAgent(payload as unknown as CreateAgentMetadata);
    return created as unknown as z.output<(typeof C.methods)['create']['response']>;
  }

  @EventPattern('agent.delete')
  async delete(
    @Payload(new ZodValidationPipe(C.methods['delete']['payload']))
    payload: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    const deleted = await this.svc.deleteAgent(payload);
    return deleted as unknown as z.output<(typeof C.methods)['delete']['response']>;
  }
}
