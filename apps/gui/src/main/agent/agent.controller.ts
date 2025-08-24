import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { AgentSessionService } from './agent.service';
import type { AgentExecuteOptions, AgentMetadata, CreateAgentMetadata } from '@agentos/core';
import type { UserMessage } from 'llm-bridge-spec';

@Controller()
export class AgentSessionController {
  constructor(private readonly svc: AgentSessionService) {}

  @EventPattern('agent.chat')
  async chat(
    @Payload() data: { agentId: string; messages: UserMessage[]; options?: AgentExecuteOptions }
  ) {
    const { agentId, messages, options } = data;
    return await this.svc.chat(agentId, messages, options);
  }

  @EventPattern('agent.end-session')
  async endSession(@Payload() data: { agentId: string; sessionId: string }) {
    const { agentId, sessionId } = data;
    return await this.svc.endSession(agentId, sessionId);
  }

  @EventPattern('agent.get-metadata')
  async getMetadata(@Payload() id: string) {
    return await this.svc.getMetadata(id);
  }

  @EventPattern('agent.get-all-metadatas')
  async getAllMetadatas() {
    return await this.svc.getAllMetadatas();
  }

  @EventPattern('agent.update')
  async updateAgent(
    @Payload() data: { agentId: string; patch: Partial<Omit<AgentMetadata, 'id'>> }
  ) {
    const { agentId, patch } = data;
    return await this.svc.updateAgent(agentId, patch);
  }

  @EventPattern('agent.create')
  async createAgent(@Payload() agent: CreateAgentMetadata) {
    return await this.svc.createAgent(agent);
  }

  @EventPattern('agent.delete')
  async deleteAgent(@Payload() id: string) {
    return await this.svc.deleteAgent(id);
  }

  // Reactive events stream (renderer demux by method='agent.events')
  @EventPattern('agent.events')
  events() {
    return this.svc.events$();
  }
}
