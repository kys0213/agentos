import { AgentClient } from '../gen/agent.client';
import { AgentContract as C } from '../../../shared/rpc/contracts/agent.contract';

export class AgentServiceAdapter {
  constructor(private readonly client: AgentClient) {}

  async chat(agentId: string, messages: unknown[], options?: unknown) {
    const payload = C.methods['chat'].payload.parse({ agentId, messages, options });
    const res = await this.client.chat(payload);
    return C.methods['chat'].response.parse(res);
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const payload = C.methods['end-session'].payload.parse({ agentId, sessionId });
    await this.client.end_session(payload);
  }

  async getAgentMetadata(id: string) {
    const res = await this.client.get_metadata(id);
    return C.methods['get-metadata'].response.parse(res);
  }

  async getAllAgentMetadatas() {
    const res = await this.client.get_all_metadatas();
    return C.methods['get-all-metadatas'].response.parse(res);
  }

  async updateAgent(agentId: string, patch: Record<string, unknown>) {
    const payload = C.methods['update'].payload.parse({ agentId, patch });
    const res = await this.client.update(payload);
    return C.methods['update'].response.parse(res);
  }

  async createAgent(agent: Record<string, unknown>) {
    const payload = C.methods['create'].payload.parse(agent);
    const res = await this.client.create(payload);
    return C.methods['create'].response.parse(res);
  }

  async deleteAgent(id: string) {
    const res = await this.client.delete(id);
    return C.methods['delete'].response.parse(res);
  }
}
