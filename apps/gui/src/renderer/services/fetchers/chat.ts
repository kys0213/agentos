import { ServiceContainer } from '../../../shared/ipc/service-container';
import type { ChatSessionMetadata, MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';

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
  sessionId: string,
  content: string,
  mentionedAgents?: string[]
): Promise<MessageHistory> {
  try {
    // TODO: Implement when ChatService is available in ServiceContainer
    // const chatService = ServiceContainer.getOrThrow('chat');
    // return await chatService.sendMessage(sessionId, content, mentionedAgents);

    console.log('🔄 sendMessage called with:', { sessionId, content, mentionedAgents });

    // Mock implementation for now
    const mockMessage: MessageHistory = {
      messageId: `msg-${Date.now()}`,
      role: 'user',
      content: {
        contentType: 'text',
        value: content,
      },
      createdAt: new Date(),
    };

    return mockMessage;
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
