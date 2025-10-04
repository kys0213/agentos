import { describe, it, expect, vi } from 'vitest';
import type { ChatClient } from '../../gen/chat.client';
import { ConversationServiceAdapter } from '../conversation.adapter';

const mockResponse = { items: [], nextCursor: '', hasMore: false };

describe('ConversationServiceAdapter', () => {
  it('scopes session list by agent id', async () => {
    const listSessions = vi.fn(async () => mockResponse);
    const client = { listSessions } satisfies Pick<ChatClient, 'listSessions'>;
    const adapter = new ConversationServiceAdapter(client as ChatClient);

    const pagination = { cursor: 'foo', limit: 10, direction: 'forward' } as const;
    await adapter.listSessions('agent-123', pagination);

    expect(listSessions).toHaveBeenCalledWith({
      agentId: 'agent-123',
      pagination,
    });
  });

  it('scopes message fetch and delete by agent id', async () => {
    const getMessages = vi.fn(async () => mockResponse);
    const deleteSession = vi.fn(async () => ({ success: true }));
    const client = { getMessages, deleteSession } satisfies Pick<ChatClient, 'getMessages' | 'deleteSession'>;
    const adapter = new ConversationServiceAdapter(client as ChatClient);

    await adapter.getMessages('agent-abc', 'session-1');
    expect(getMessages).toHaveBeenCalledWith({
      agentId: 'agent-abc',
      sessionId: 'session-1',
      pagination: undefined,
    });

    await adapter.deleteSession('agent-xyz', 'session-9');
    expect(deleteSession).toHaveBeenCalledWith({
      agentId: 'agent-xyz',
      sessionId: 'session-9',
    });
  });
});
