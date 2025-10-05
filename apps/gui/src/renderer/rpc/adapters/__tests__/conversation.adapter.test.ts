import { describe, it, expect, vi } from 'vitest';
import type { CloseFn, RpcClient } from '../../../../shared/rpc/transport';
import { ChatClient } from '../../gen/chat.client';
import { ConversationServiceAdapter } from '../conversation.adapter';

const mockPage = { items: [], nextCursor: '', hasMore: false } as const;

const createTransport = (): RpcClient => ({
  async request<TRes = unknown, TReq = unknown>(channel: string, _payload?: TReq): Promise<TRes> {
    if (channel === 'chat.delete-session') {
      return { success: true } as TRes;
    }

    if (channel === 'chat.list-sessions' || channel === 'chat.get-messages') {
      return mockPage as TRes;
    }

    throw new Error(`Unexpected channel requested: ${channel}`);
  },

  on<T = unknown>(
    _channel: string,
    _handler: (payload: T) => void,
    _onError?: (e: unknown) => void
  ): CloseFn {
    return async () => {};
  },
});

const createClient = () => {
  const transport = createTransport();
  const requestSpy = vi.spyOn(transport, 'request');
  return { client: new ChatClient(transport), request: requestSpy };
};

describe('ConversationServiceAdapter', () => {
  it('scopes session list by agent id', async () => {
    const { client, request } = createClient();
    const adapter = new ConversationServiceAdapter(client);

    const pagination = { cursor: 'foo', limit: 10, direction: 'forward' } as const;
    await adapter.listSessions('agent-123', pagination);

    expect(request).toHaveBeenCalledWith('chat.list-sessions', {
      agentId: 'agent-123',
      pagination,
    });
  });

  it('scopes message fetch and delete by agent id', async () => {
    const { client, request } = createClient();
    const adapter = new ConversationServiceAdapter(client);

    await adapter.getMessages('agent-abc', 'session-1');
    expect(request).toHaveBeenLastCalledWith('chat.get-messages', {
      agentId: 'agent-abc',
      sessionId: 'session-1',
      pagination: undefined,
    });

    await adapter.deleteSession('agent-xyz', 'session-9');
    expect(request).toHaveBeenLastCalledWith('chat.delete-session', {
      agentId: 'agent-xyz',
      sessionId: 'session-9',
    });
  });
});
