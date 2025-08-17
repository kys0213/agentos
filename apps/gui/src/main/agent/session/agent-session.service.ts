import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  AgentService,
  CursorPaginationResult,
} from '@agentos/core';
import { Inject, Injectable } from '@nestjs/common';
import type { UserMessage } from 'llm-bridge-spec';
import { AGENT_SERVICE_TOKEN } from '../../common/agent/constants';

@Injectable()
export class AgentSessionService {
  constructor(@Inject(AGENT_SERVICE_TOKEN) private readonly agentService: AgentService) {}

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions
  ): Promise<AgentChatResult> {
    // 활성 브릿지 있으면 SimpleAgent, 없으면 폴백 에코
    const agent = await this.agentService.getAgent(agentId);

    if (!agent) throw new Error(`Agent not found: ${agentId}`);

    const result = await agent.chat(messages, options);

    return result;
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const agent = await this.agentService.getAgent(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    await agent.endSession(sessionId);
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
}
