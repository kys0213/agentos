import type { Agent } from '../agent';
import type { AgentSession, AgentSessionEvent, AgentSessionEventMap } from '../agent-session';

import { AgentEventBridge } from '../agent-event-bridge';
import { Unsubscribe } from '../../common/event/event-subscriber';
import type { AgentStatus, AgentChatResult } from '../agent';
import type { AgentMetadata } from '../agent-metadata';
import type { AgentEvent } from '../agent-events';
import type { AgentService } from '../agent.service';
import type { ReadonlyPreset, Preset } from '../../preset/preset';
import type { MessageHistory } from '../../chat/chat-session';

class TestPublisher {
  calls: Array<{ channel: string; payload: unknown }> = [];
  publish(channel: string, payload: unknown) {
    this.calls.push({ channel, payload });
  }
}

type AgentHandler = (e: AgentEvent) => void;

class FakeEventfulAgent implements Agent {
  update(_patch: Partial<AgentMetadata>): Promise<void> {
    throw new Error('Method not implemented.');
  }
  delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  id = 'a-1';
  private handlers = new Set<AgentHandler>();
  getMetadata = async () => ({
    id: this.id,
    name: 'A',
    description: '',
    icon: '',
    keywords: [],
    preset: makePreset(),
    status: 'active' as AgentStatus,
    sessionCount: 0,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  isActive = async () => true;
  isIdle = async () => false;
  isInactive = async () => false;
  isError = async () => false;
  idle = async () => {};
  activate = async () => {};
  inactive = async () => {};
  chat = async (): Promise<AgentChatResult> => ({ messages: [], sessionId: 's-1' });
  createSession = async (): Promise<AgentSession> => new FakeSession('s-1');
  endSession = async () => {};
  on(handler: AgentHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  emit(event: AgentEvent) {
    for (const h of this.handlers) {
      h(event);
    }
  }
}

class FakeSession implements AgentSession {
  readonly id: string;
  readonly sessionId: string;
  private handlers: { [K in AgentSessionEvent]: Set<(p: AgentSessionEventMap[K]) => void> } = {
    message: new Set(),
    status: new Set(),
    error: new Set(),
    terminated: new Set(),
    promptRequest: new Set(),
    consentRequest: new Set(),
    sensitiveInputRequest: new Set(),
  };
  constructor(id: string) {
    this.id = id;
    this.sessionId = id;
  }
  agentId = 'a-1';
  chat = async () => {
    const out: Readonly<MessageHistory>[] = [];
    return out;
  };
  getHistory = async () => ({ items: [], nextCursor: '', hasMore: false });
  terminate = async () => {};
  providePromptResponse = async () => {};
  provideConsentDecision = async () => {};
  provideSensitiveInput = async () => {};
  on<E extends AgentSessionEvent>(
    event: E,
    handler: (p: AgentSessionEventMap[E]) => void
  ): Unsubscribe {
    const set = this.handlers[event] as Set<(p: AgentSessionEventMap[E]) => void>;
    set.add(handler);
    return () => set.delete(handler);
  }
  emit<E extends AgentSessionEvent>(event: E, payload: AgentSessionEventMap[E]) {
    const set = this.handlers[event] as Set<(p: AgentSessionEventMap[E]) => void>;
    for (const h of set) {
      h(payload);
    }
  }
}

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
      createAgent: async () => new FakeEventfulAgent(),
      getAgent: async () => null,
      listAgents: async () => ({ items: [], nextCursor: '', hasMore: false }),
      searchAgents: async () => ({ items: [], nextCursor: '', hasMore: false }),
      createSession: async () => new FakeSession('s-x'),
      execute: async () => ({ messages: [], sessionId: 's-x' }),
    };
    const publisher = new TestPublisher();
    const bridge = new AgentEventBridge(manager, publisher);

    const agent = new FakeEventfulAgent();
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

    const session = new FakeSession('s-1');
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
