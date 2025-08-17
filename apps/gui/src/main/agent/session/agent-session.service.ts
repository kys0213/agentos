import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  AgentService,
  CursorPaginationResult,
} from '@agentos/core';
import { Inject, Injectable } from '@nestjs/common';
import type { Message, UserMessage } from 'llm-bridge-spec';
import { OutboundChannel } from '../../common/event/outbound-channel';
import { AgentOutboundEvent } from '../../common/event/events';
import { map } from 'rxjs';
import { AGENT_SERVICE_TOKEN } from '../../common/agent/constants';

@Injectable()
export class AgentSessionService {
  constructor(
    @Inject(AGENT_SERVICE_TOKEN) private readonly agentService: AgentService,
    private readonly outbound: OutboundChannel
  ) {}

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    // 활성 브릿지 있으면 SimpleAgent, 없으면 폴백 에코
    const agent = await this.agentService.getAgent(agentId);

    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const result = await agent.chat(messages, options);

    // 스트림 브로드캐스트: 어시스턴트 메시지 이벤트 발행
    const last = result.messages[result.messages.length - 1];
    if (last) {
      this.outbound.emit({
        type: 'agent.session.message',
        payload: { sessionId: result.sessionId, data: last as unknown as Message },
      });
    }
    return result;
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const agent = await this.agentService.getAgent(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    await agent.endSession(sessionId);
    this.outbound.emit({ type: 'agent.session.ended', payload: { sessionId } });
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

    return {
      items: await Promise.all(agents.items.map((a) => a.getMetadata())),
      nextCursor: agents.nextCursor,
    };
  }

  async updateAgent(
    agentId: string,
    patch: Partial<Omit<AgentMetadata, 'id'>>
  ): Promise<AgentMetadata> {
    const agent = await this.agentService.getAgent(agentId);

    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const updated = await agent.update(patch as Partial<AgentMetadata>);
    return updated;
  }

  async createAgent(agent: Omit<AgentMetadata, 'id'> & { id: string }): Promise<AgentMetadata> {
    const created = await this.agentService.createAgent(agent);
    return created;
  }

  async deleteAgent(id: string): Promise<AgentMetadata> {
    const agent = await this.agentService.getAgent(id);
    if (!agent) throw new Error(`Agent not found: ${id}`);
    // await agent.delete();
    return await agent.getMetadata();
  }

  events$() {
    // expose agent.* outbound events only
    return this.outbound
      .ofType('agent.')
      .pipe(map((ev) => ev as AgentOutboundEvent));
  }
}
