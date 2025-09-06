import type { z } from 'zod';
import { AgentClient } from '../gen/agent.client';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';
import type { ReadonlyAgentMetadata } from '@agentos/core';

export class AgentServiceAdapter {
  constructor(private readonly client: AgentClient) {}

  async chat(
    agentId: string,
    messages: z.input<(typeof C.methods)['chat']['payload']>['messages'],
    options?: z.input<(typeof C.methods)['chat']['payload']>['options']
  ): Promise<z.output<(typeof C.methods)['chat']['response']>> {
    const payload = C.methods['chat'].payload.parse({ agentId, messages, options });
    const res = await this.client.chat(payload);
    return C.methods['chat'].response.parse(res);
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const payload = C.methods['end-session'].payload.parse({ agentId, sessionId });
    await this.client.end_session(payload);
  }

  async getAgentMetadata(id: string): Promise<ReadonlyAgentMetadata> {
    const res = await this.client.get_metadata(id);
    return C.methods['get-metadata'].response.parse(res) as ReadonlyAgentMetadata;
  }

  async getAllAgentMetadatas(): Promise<ReadonlyAgentMetadata[]> {
    const res = await this.client.get_all_metadatas();
    return C.methods['get-all-metadatas'].response.parse(res) as ReadonlyAgentMetadata[];
  }

  async updateAgent(
    agentId: string,
    patch: z.input<(typeof C.methods)['update']['payload']>['patch']
  ): Promise<z.output<(typeof C.methods)['update']['response']>> {
    const payload = C.methods['update'].payload.parse({ agentId, patch });
    const res = await this.client.update(payload);
    return C.methods['update'].response.parse(res);
  }

  async createAgent(
    agent: z.input<(typeof C.methods)['create']['payload']>
  ): Promise<ReadonlyAgentMetadata> {
    const payload = C.methods['create'].payload.parse(agent);
    const res = await this.client.create(payload);
    return C.methods['create'].response.parse(res) as ReadonlyAgentMetadata;
  }

  async deleteAgent(
    id: z.input<(typeof C.methods)['delete']['payload']>
  ): Promise<z.output<(typeof C.methods)['delete']['response']>> {
    const res = await this.client.delete(id);
    return C.methods['delete'].response.parse(res);
  }
}
