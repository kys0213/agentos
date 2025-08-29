import { AgentClient } from '../gen/agent.client';

export class AgentServiceAdapter {
  constructor(private readonly client: AgentClient) {}

  async chat(agentId: string, messages: unknown[], options?: unknown) {
    return this.client.chat({ agentId, messages, options } as any);
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    await this.client.end_session({ agentId, sessionId });
  }

  async getAgentMetadata(id: string) {
    return this.client.get_metadata(id);
  }

  async getAllAgentMetadatas() {
    return this.client.get_all_metadatas();
  }

  async updateAgent(agentId: string, patch: Record<string, unknown>) {
    return this.client.update({ agentId, patch } as any);
  }

  async createAgent(agent: Record<string, unknown>) {
    return this.client.create(agent as any);
  }

  async deleteAgent(id: string) {
    return this.client.delete(id);
  }
}
