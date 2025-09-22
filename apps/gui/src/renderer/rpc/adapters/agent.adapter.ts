import type { z } from 'zod';
import { AgentClient } from '../gen/agent.client';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';
import type { ReadonlyAgentMetadata } from '@agentos/core';

export class AgentServiceAdapter {
  constructor(private readonly client: AgentClient) {}

  async chat(
    agentId: string,
    messages: z.input<(typeof C.methods)['chat']['payload']>['messages'],
    options?: z.input<(typeof C.methods)['chat']['payload']>['options'],
    context?: { mentionedAgentIds?: string[] }
  ): Promise<z.output<(typeof C.methods)['chat']['response']>> {
    return this.client.chat({
      agentId,
      messages,
      options,
      mentionedAgentIds: context?.mentionedAgentIds,
    });
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    await this.client.end_session({ agentId, sessionId });
  }

  async getAgentMetadata(id: string): Promise<ReadonlyAgentMetadata> {
    return (await this.client.get_metadata(id)) as ReadonlyAgentMetadata;
  }

  async getAllAgentMetadatas(): Promise<ReadonlyAgentMetadata[]> {
    return (await this.client.get_all_metadatas()) as ReadonlyAgentMetadata[];
  }

  async updateAgent(
    agentId: string,
    patch: z.input<(typeof C.methods)['update']['payload']>['patch']
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    return this.client.update({ agentId, patch });
  }

  async createAgent(
    agent: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<ReadonlyAgentMetadata> {
    return (await this.client.create(agent)) as ReadonlyAgentMetadata;
  }

  async deleteAgent(
    id: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    return this.client.delete(id);
  }
}
