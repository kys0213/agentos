import type { RpcClient } from '../../../shared/rpc/transport';
import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  CursorPagination,
  CursorPaginationResult,
  CreateAgentMetadata,
  ChatSessionDescription,
} from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';

export class AgentRpcService {
  constructor(private readonly transport: RpcClient) {}

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    return this.transport.request('agent.chat', { agentId, messages, options });
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    await this.transport.request('agent.end-session', { agentId, sessionId });
  }

  async getAgentMetadata(id: string): Promise<AgentMetadata | null> {
    return this.transport.request('agent.get-metadata', id);
  }

  async getAllAgentMetadatas(): Promise<AgentMetadata[]> {
    return this.transport.request('agent.get-all-metadatas');
  }

  async updateAgent(
    agentId: string,
    patch: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    return this.transport.request('agent.update', { agentId, patch });
  }

  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    return this.transport.request('agent.create', agent);
  }

  async deleteAgent(id: string): Promise<AgentMetadata> {
    return this.transport.request('agent.delete', id);
  }

  async listSessions(
    pagination?: CursorPagination
  ): Promise<CursorPaginationResult<ChatSessionDescription>> {
    return this.transport.request('chat.list-sessions', pagination); // TODO: controller 채널 확정 시 조정
  }
}
