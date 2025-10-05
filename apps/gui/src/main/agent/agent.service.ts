import type {
  AgentChatResult,
  AgentExecuteOptions,
  AgentMetadata,
  AgentService,
  CreateAgentMetadata,
  CursorPaginationResult,
  MessageHistory,
} from '@agentos/core';
import { Inject, Injectable } from '@nestjs/common';
import type { Message, UserMessage } from 'llm-bridge-spec';
import { AGENT_SERVICE_TOKEN } from '../common/agent/constants';
import { AgentEventBridge } from './events/agent-event-bridge';
import { ChatService } from '../chat/chat.service';
import { MultiAgentCoordinator } from './multi-agent-coordinator';
import { appendFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

@Injectable()
export class AgentSessionService {
  private readonly coordinator: MultiAgentCoordinator;

  constructor(
    @Inject(AGENT_SERVICE_TOKEN) private readonly agentService: AgentService,
    private readonly events: AgentEventBridge,
    @Inject(ChatService) private readonly chatService: Pick<ChatService, 'appendMessageToSession'>
  ) {
    this.coordinator = new MultiAgentCoordinator(this.agentService);
  }

  async chat(
    agentId: string,
    messages: UserMessage[],
    options?: AgentExecuteOptions,
    mentionedAgentIds?: string[]
  ): Promise<AgentChatResult> {
    try {
      const normalizedMentions = Array.from(
        new Set(
          (mentionedAgentIds ?? []).filter(
            (id): id is string => typeof id === 'string' && id.length > 0
          )
        )
      );

      const coordinatorResult = await this.coordinator.execute({
        primaryAgentId: agentId,
        messages,
        mentionedAgentIds: normalizedMentions,
        options,
      });

      const aggregatedMessages: Message[] = [];

      try {
        for (const exec of coordinatorResult.executions) {
          for (let i = 0; i < exec.result.messages.length; i++) {
            const baseMessage = exec.result.messages[i];
            aggregatedMessages.push(baseMessage);

            const messageHistory: MessageHistory = {
              ...baseMessage,
              messageId: `${exec.result.sessionId}-${exec.metadata.id}-${Date.now()}-${i}`,
              createdAt: new Date(),
              agentMetadata: exec.metadata,
            };

            await this.chatService.appendMessageToSession(
              coordinatorResult.sessionId,
              agentId,
              messageHistory
            );
          }

          const last: Message | undefined = exec.result.messages[exec.result.messages.length - 1];
          if (last) {
            this.events.publishSessionMessage(exec.result.sessionId, last);
          }
        }
      } catch (error) {
        console.error('Failed to save messages to ChatService:', error);
        // 메시지 저장 실패는 전체 chat 실패로 이어지지 않도록 함
      }

      return {
        sessionId: coordinatorResult.sessionId,
        messages: aggregatedMessages,
      };
    } catch (error) {
      console.error('[AgentSessionService.chat] failed', error);
      try {
        const profileDir = process.env.ELECTRON_TEST_PROFILE;
        if (profileDir) {
          const serializedError =
            error instanceof Error ? (error.stack ?? error.message) : String(error);
          appendFileSync(
            path.join(profileDir, 'agent-session-error.log'),
            `${new Date().toISOString()} ${serializedError}\n`
          );
        }
      } catch (logError) {
        console.error('Failed to write agent session error log', logError);
      }
      throw error;
    }
  }

  async endSession(agentId: string, sessionId: string): Promise<void> {
    const agent = await this.agentService.getAgent(agentId);
    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }
    await agent.endSession(sessionId);
    this.events.publishSessionEnded(sessionId);
  }

  async getMetadata(id: string): Promise<AgentMetadata | null> {
    const agent = await this.agentService.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }
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

    if (!agent) {
      throw new Error(`Agent not found: ${agentId}`);
    }

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
