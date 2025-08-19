import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  AgentService,
  CreateAgentMetadata,
  CursorPaginationResult,
} from '@agentos/core';
import { Inject, Injectable } from '@nestjs/common';
import type { Message, UserMessage } from 'llm-bridge-spec';
import { map } from 'rxjs';
import { AGENT_SERVICE_TOKEN } from '../../common/agent/constants';
import { AgentEventBridge } from '../events/agent-event-bridge';

@Injectable()
export class AgentSessionService {
  constructor(
    @Inject(AGENT_SERVICE_TOKEN) private readonly agentService: AgentService,
    private readonly events: AgentEventBridge
  ) {}

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    // 활성 브릿지 있으면 SimpleAgent, 없으면 폴백 에코
    const agent = await this.agentService.getAgent(agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

    const result = await agent.chat(messages, options);

    // 스트림 브로드캐스트: 어시스턴트 메시지 이벤트 발행
    const last: Message | undefined = result.messages[result.messages.length - 1];
    if (last) this.events.publishSessionMessage(result.sessionId, last);

    return result;
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const agent = await this.agentService.getAgent(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    await agent.endSession(sessionId);
    this.events.publishSessionEnded(sessionId);
  }

  async getMetadata(id: string): Promise<AgentMetadata | null> {
    const agent = await this.agentService.getAgent(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    return await agent.getMetadata();
  }

  async getAllMetadatas(): Promise<CursorPaginationResult<AgentMetadata>> {
    const agents = await this.agentService.listAgents({
      limit: 1000,
      cursor: '',
      direction: 'forward',
    });

    const items = await Promise.all(agents.items.map((a) => a.getMetadata()));
    const nextCursor = agents.nextCursor;
    return {
      items,
      nextCursor,
      hasMore: !!nextCursor,
    };
  }

  async updateAgent(
    agentId: string,
    patch: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    const agent = await this.agentService.getAgent(agentId);

    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    await agent.update(patch as Partial<AgentMetadata>);

    return await agent.getMetadata();
  }

  async createAgent(agent: CreateAgentMetadata): Promise<AgentMetadata> {
    const created = await this.agentService.createAgent(agent);

    return await created.getMetadata();
  }

  async deleteAgent(id: string): Promise<AgentMetadata> {
    const agent = await this.agentService.getAgent(id);

    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    await agent.delete();

    return await agent.getMetadata();
  }

  events$() {
    // expose agent.* outbound events only
    return this.events.stream();
  }
}
