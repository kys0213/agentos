import type { Agent } from '../agent';
import type { UserMessage } from 'llm-bridge-spec';
import type { AgentSession, AgentSessionEvent, AgentSessionEventMap } from '../agent-session';

import { AgentEventBridge } from '../agent-event-bridge';
import { Unsubscribe } from '../../common/event/event-subscriber';
import type { AgentStatus, AgentChatResult } from '../agent';
import type { ReadonlyAgentMetadata } from '../agent-metadata';
import type { AgentEvent } from '../agent-events';
import type { AgentService } from '../agent.service';
import type { ReadonlyPreset, Preset } from '../../preset/preset';
import type { MessageHistory } from '../../chat/chat-session';

const makePublisher = () => {
  const calls: Array<{ channel: string; payload: unknown }> = [];
  return {
    calls,
    publish(channel: string, payload: unknown) {
      calls.push({ channel, payload });
    },
  };
};

type AgentHandler = (e: AgentEvent) => void;

const makeEventfulAgent = (): Agent & {
  on: (h: AgentHandler) => Unsubscribe;
  emit: (e: AgentEvent) => void;
} => {
  const id = 'a-1';
  const handlers = new Set<AgentHandler>();
  return {
    id,
    async update() {
      throw new Error('Method not implemented.');
    },
    async delete() {
      throw new Error('Method not implemented.');
    },
    async getMetadata() {
      return {
        id,
        name: 'A',
        description: '',
        icon: '',
        keywords: [],
        preset: makePreset(),
        status: 'active' as AgentStatus,
        sessionCount: 0,
        usageCount: 0,
      } satisfies ReadonlyAgentMetadata;
    },
    async isActive() {
      return true;
    },
    async isIdle() {
      return false;
    },
    async isInactive() {
      return false;
    },
    async isError() {
      return false;
    },
    async idle() {},
    async activate() {},
    async inactive() {},
    async chat(_messages: UserMessage[]): Promise<AgentChatResult> {
      return { messages: [], sessionId: 's-1' };
    },
    async createSession(_options?: {
      sessionId?: string;
      presetId?: string;
    }): Promise<AgentSession> {
      return makeSession('s-1');
    },
    async endSession(_sessionId: string) {},
    on(handler: AgentHandler): Unsubscribe {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },
    emit(event: AgentEvent) {
      for (const h of handlers) h(event);
    },
  };
};

const makeSession = (
  id: string
): AgentSession & {
  emit: <E extends AgentSessionEvent>(event: E, payload: AgentSessionEventMap[E]) => void;
} => {
  const handlers: { [K in AgentSessionEvent]: Set<(p: AgentSessionEventMap[K]) => void> } = {
    message: new Set(),
    status: new Set(),
    error: new Set(),
    terminated: new Set(),
    promptRequest: new Set(),
    consentRequest: new Set(),
    sensitiveInputRequest: new Set(),
  };
  return {
    sessionId: id,
    agentId: 'a-1',
    async chat() {
      return [] as Readonly<MessageHistory>[];
    },
    async getHistory() {
      return { items: [], nextCursor: '', hasMore: false };
    },
    async terminate() {},
    async providePromptResponse() {},
    async provideConsentDecision() {},
    async provideSensitiveInput() {},
    on<E extends AgentSessionEvent>(event: E, handler: (p: AgentSessionEventMap[E]) => void) {
      const set = handlers[event] as Set<(p: AgentSessionEventMap[E]) => void>;
      set.add(handler);
      return () => set.delete(handler);
    },
    emit<E extends AgentSessionEvent>(event: E, payload: AgentSessionEventMap[E]) {
      const set = handlers[event] as Set<(p: AgentSessionEventMap[E]) => void>;
      for (const h of set) h(payload);
    },
  };
};

function makePreset(): ReadonlyPreset {
  const p: Preset = {
    id: 'p1',
    name: 'Preset',
    description: '',
    author: 'test',
    createdAt: new Date(0),
    updatedAt: new Date(0),
    version: '1.0.0',
    systemPrompt: '',
    enabledMcps: [],
    llmBridgeName: 'none',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: { indexed: 0, vectorized: 0, totalSize: 0 },
    category: ['general'],
  };
  return p;
}

describe('AgentEventBridge', () => {
  test('publishes agent events and session events', async () => {
    const manager: AgentService = {
      createAgent: async () => makeEventfulAgent(),
      getAgent: async () => null,
      listAgents: async () => ({ items: [], nextCursor: '', hasMore: false }),
      searchAgents: async () => ({ items: [], nextCursor: '', hasMore: false }),
      createSession: async () => makeSession('s-x'),
      execute: async () => ({ messages: [], sessionId: 's-x' }),
    };
    const publisher = makePublisher();
    const bridge = new AgentEventBridge(manager, publisher);

    const agent = makeEventfulAgent();
    await bridge.attachAgent(agent);

    agent.emit({ type: 'statusChanged', agentId: agent.id, status: 'active' });
    agent.emit({ type: 'metadataUpdated', agentId: agent.id, patch: { name: 'B' } });
    agent.emit({ type: 'sessionCreated', agentId: agent.id, sessionId: 's-1' });
    agent.emit({ type: 'sessionEnded', agentId: agent.id, sessionId: 's-1' });
    agent.emit({ type: 'error', agentId: agent.id, error: new Error('boom') });

    expect(publisher.calls.some((c) => c.channel === 'agent/status')).toBe(true);
    expect(publisher.calls.some((c) => c.channel === 'agent/change')).toBe(true);
    expect(publisher.calls.some((c) => c.channel === 'agent/session/created')).toBe(true);
    expect(publisher.calls.some((c) => c.channel === 'agent/session/ended')).toBe(true);
    expect(publisher.calls.some((c) => c.channel === 'agent/error')).toBe(true);

    const session = makeSession('s-1');
    bridge.attachSession(agent.id, session);
    session.emit('status', { state: 'running' });
    const mh: MessageHistory = {
      role: 'assistant',
      content: [{ contentType: 'text', value: 'hi' }],
      messageId: 'm1',
      createdAt: new Date(),
    };
    session.emit('message', { message: mh });
    session.emit('error', { error: new Error('e') });

    expect(publisher.calls.some((c) => c.channel.endsWith('/status'))).toBe(true);
    expect(publisher.calls.some((c) => c.channel.endsWith('/message'))).toBe(true);
    expect(publisher.calls.some((c) => c.channel.endsWith('/error'))).toBe(true);
  });
});
