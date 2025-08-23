import { ServiceContainer } from '../../ipc/service-container';
import type { ChatSessionMetadata, MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';
import type { Message, StringContent } from 'llm-bridge-spec';

/**
 * Chat-related fetcher functions using ServiceContainer
 * Follows the same pattern as subagents.ts and presets.ts
 */

export async function fetchChatSessions(): Promise<ChatSessionMetadata[]> {
  try {
    // TODO: Implement when ChatService is available in ServiceContainer
    // const chatService = ServiceContainer.getOrThrow('chat');
    // return await chatService.getAllSessions();

    console.log('🔄 fetchChatSessions called - returning mock data for now');
    return [];
  } catch (error) {
    console.error('Failed to fetch chat sessions:', error);
    throw error;
  }
}

export async function createChatSession(
  agentIds: string[],
  title?: string
): Promise<ChatSessionMetadata> {
  try {
    // TODO: Implement when ChatService is available in ServiceContainer
    // const chatService = ServiceContainer.getOrThrow('chat');
    // return await chatService.createSession({ agentIds, title });

    console.log('🔄 createChatSession called with:', { agentIds, title });

    // Mock implementation for now
    const mockSession: ChatSessionMetadata = {
      sessionId: `session-${Date.now()}`,
      agentId: agentIds[0] ?? 'unknown-agent',
      title: title || `Chat with ${agentIds.length} agents`,
      joinedAgents: [], // TODO: Resolve agent IDs to AgentMetadata
      recentMessages: [],
      totalMessages: 0,
      totalUsage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return mockSession;
  } catch (error) {
    console.error('Failed to create chat session:', error);
    throw error;
  }
}

export async function sendMessage(
  agentId: string,
  content: string,
  _mentionedAgents?: string[]
): Promise<MessageHistory[]> {
  try {
    const agentService = ServiceContainer.getOrThrow('agent');

    const userMessage: Message = {
      role: 'user',
      content: [{ contentType: 'text', value: content } as StringContent],
    };
    const result = await agentService.chat(agentId, [userMessage], {
      sessionId: agentId,
      maxTurnCount: 1,
    });

    // 결과 메시지를 MessageHistory로 변환 (원본 Message 구조 보존)
    const mapped: MessageHistory[] = result.messages.map((m, idx: number) => ({
      ...m,
      messageId: `assistant-${result.sessionId}-${Date.now()}-${idx}`,
      createdAt: new Date(),
    }));

    return mapped;
  } catch (error) {
    console.error('Failed to send message:', error);
    throw error;
  }
}

export async function fetchChatHistory(sessionId: string): Promise<MessageHistory[]> {
  try {
    // TODO: Implement when ChatService is available in ServiceContainer
    // const chatService = ServiceContainer.getOrThrow('chat');
    // return await chatService.getMessageHistory(sessionId);

    console.log('🔄 fetchChatHistory called with:', { sessionId });
    return [];
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    throw error;
  }
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  try {
    // TODO: Implement when ChatService is available in ServiceContainer
    // const chatService = ServiceContainer.getOrThrow('chat');
    // await chatService.deleteSession(sessionId);

    console.log('🔄 deleteChatSession called with:', { sessionId });
  } catch (error) {
    console.error('Failed to delete chat session:', error);
    throw error;
  }
}

/**
 * Get agents that can be mentioned in chat
 * Uses existing AgentService from ServiceContainer
 */
export async function fetchMentionableAgents(): Promise<ReadonlyAgentMetadata[]> {
  try {
    if (ServiceContainer.has('agent')) {
      const agentService = ServiceContainer.getOrThrow('agent');
      const allAgents = await agentService.getAllAgentMetadatas();

      // Filter to only active and idle agents (mentionable)
      return allAgents.filter((agent) => agent.status === 'active' || agent.status === 'idle');
    }

    console.warn('⚠️ AgentService not found in ServiceContainer');
    return [];
  } catch (error) {
    console.error('Failed to fetch mentionable agents:', error);
    throw error;
  }
}

/**
 * Get currently active agents for auto-responses
 * Uses existing AgentService from ServiceContainer
 */
export async function fetchActiveAgents(): Promise<ReadonlyAgentMetadata[]> {
  try {
    if (ServiceContainer.has('agent')) {
      const agentService = ServiceContainer.getOrThrow('agent');
      const allAgents = await agentService.getAllAgentMetadatas();

      // Filter to only active agents
      return allAgents.filter((agent) => agent.status === 'active');
    }

    console.warn('⚠️ AgentService not found in ServiceContainer');
    return [];
  } catch (error) {
    console.error('Failed to fetch active agents:', error);
    throw error;
  }
}
