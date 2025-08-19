import {
  Agent,
  AgentChatResult,
  AgentExecuteOptions,
  AgentSession,
  ReadonlyAgentMetadata,
} from '@agentos/core';
import { UserMessage } from 'llm-bridge-spec';
import { AgentProtocol } from '../../shared/types/agent-protocol';

/**
 * IpcChannel을 통해 환경에 독립적으로 동작하는 Agent 클래스
 * 모든 환경에서 동일한 인터페이스를 제공하기 위해 사용
 */
export class IpcAgent implements Agent {
  constructor(
    private readonly agentProtocol: AgentProtocol,
    private readonly agentId: string
  ) {}

  createSession(options?: { sessionId?: string; presetId?: string }): Promise<AgentSession> {
    throw new Error('Method not implemented.');
  }

  async getMetadata(): Promise<ReadonlyAgentMetadata> {
    const metadata = await this.agentProtocol.getAgentMetadata(this.agentId);

    // TODO 캐시 적용 고민해보기
    // 캐시 적용시 수정되거나 상태가 변경된 경우 캐시 무효화 필요

    if (!metadata) {
      throw new Error('Agent not found');
    }

    return metadata;
  }

  async isActive(): Promise<boolean> {
    const metadata = await this.getMetadata();

    return metadata.status === 'active';
  }

  async isIdle(): Promise<boolean> {
    const metadata = await this.getMetadata();

    return metadata.status === 'idle';
  }

  async isInactive(): Promise<boolean> {
    const metadata = await this.getMetadata();

    return metadata.status === 'inactive';
  }

  async isError(): Promise<boolean> {
    const metadata = await this.getMetadata();

    return metadata.status === 'error';
  }

  get id() {
    return this.agentId;
  }

  async idle(): Promise<void> {
    await this.agentProtocol.updateAgent(this.agentId, { status: 'idle' });
  }

  async activate(): Promise<void> {
    await this.agentProtocol.updateAgent(this.agentId, { status: 'active' });
  }

  async inactive(): Promise<void> {
    await this.agentProtocol.updateAgent(this.agentId, { status: 'inactive' });
  }

  async endSession(sessionId: string): Promise<void> {
    await this.agentProtocol.endSession(this.agentId, sessionId);
  }

  async chat(messages: UserMessage[], options?: AgentExecuteOptions): Promise<AgentChatResult> {
    return await this.agentProtocol.chat(this.agentId, messages, options);
  }

  async update(patch: Partial<ReadonlyAgentMetadata>): Promise<void> {
    await this.agentProtocol.updateAgent(this.agentId, patch as any);
  }

  async delete(): Promise<void> {
    await this.agentProtocol.deleteAgent(this.agentId);
  }
}
