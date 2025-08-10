import type {
  Agent,
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  CreateAgentMetadata,
} from '@agentos/core';
import { UserMessage } from 'llm-bridge-spec';
import { IpcAgent } from './ipc-agent';
import type { IpcChannel } from '../../shared/types/ipc-channel';
import type { AgentProtocol } from '../../shared/types/agent-protocol';

/**
 * Agent 관련 기능을 제공하는 서비스 클래스
 * IpcChannel을 통해 환경에 독립적으로 동작
 */
export class AgentService implements AgentProtocol {
  constructor(private ipcChannel: IpcChannel) {}

  async getAllAgents(): Promise<Agent[]> {
    const metadatas = await this.ipcChannel.getAllAgentMetadatas();

    // TODO Lru 적용 고민해보기
    return metadatas.map((metadata) => new IpcAgent(this.ipcChannel, metadata.id));
  }

  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    return this.ipcChannel.createAgent(agent);
  }

  async updateAgent(
    agentId: string,
    agent: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    return this.ipcChannel.updateAgent(agentId, agent);
  }
  async deleteAgent(id: string): Promise<AgentMetadata> {
    return this.ipcChannel.deleteAgent(id);
  }

  async getAgentMetadata(id: string): Promise<AgentMetadata | null> {
    return await this.ipcChannel.getAgentMetadata(id);
  }

  async getAvailableAgents(): Promise<Agent[]> {
    const agents = await this.getAllAgents();

    return await Promise.all(
      agents.filter(async (agent) => (await agent.isActive()) || (await agent.isIdle()))
    );
  }

  async getActiveAgents(): Promise<Agent[]> {
    const agents = await this.getAllAgents();
    return await Promise.all(agents.filter(async (agent) => await agent.isActive()));
  }

  async getAllAgentMetadatas(): Promise<AgentMetadata[]> {
    return this.ipcChannel.getAllAgentMetadatas();
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    return this.ipcChannel.endSession(agentId, sessionId);
  }

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    return await this.ipcChannel.chat(agentId, messages, options);
  }

  /**
   * 특정 이름의 Agent가 존재하는지 확인
   */
  async existsByName(name: string): Promise<boolean> {
    const agents = await this.getAllAgents();
    return agents.some((agent) => agent.getMetadata().then((metadata) => metadata.name === name));
  }
}
