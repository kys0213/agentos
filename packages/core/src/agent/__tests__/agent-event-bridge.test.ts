import type { Agent } from '../agent';
import type { AgentSession, AgentSessionEvent, AgentSessionEventMap } from '../agent-session';

import { AgentEventBridge } from '../agent-event-bridge';
import { Unsubscribe } from '../../common/event/event-subscriber';
import { AgentStatus } from '../agent';

class TestPublisher {
  calls: Array<{ channel: string; payload: any }> = [];
  publish(channel: string, payload: unknown) {
    this.calls.push({ channel, payload });
  }
}

type AgentHandler = (e: any) => void;

class FakeEventfulAgent implements Agent {
  id = 'a-1';
  private handlers = new Set<AgentHandler>();
  getMetadata = async () => ({
    id: this.id,
    name: 'A',
    description: '',
    icon: '',
    keywords: [],
    preset: {} as any,
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
  chat = async () => ({ messages: [], sessionId: 's-1' }) as any;
  createSession = async () => ({ sessionId: 's-1' }) as any as AgentSession;
  endSession = async () => {};
  on(handler: AgentHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  emit(event: any) {
    for (const h of this.handlers) h(event);
  }
}

class FakeSession implements AgentSession {
  readonly id: string;
  readonly sessionId: string;
  private handlers: Partial<Record<AgentSessionEvent, Set<(p: any) => void>>> = {};
  constructor(id: string) {
    this.id = id;
    this.sessionId = id;
  }
  chat = async () => [] as any;
  getHistory = async () => ({ items: [], nextCursor: '' });
  terminate = async () => {};
  providePromptResponse = async () => {};
  provideConsentDecision = async () => {};
  provideSensitiveInput = async () => {};
  on<E extends AgentSessionEvent>(
    event: E,
    handler: (p: AgentSessionEventMap[E]) => void
  ): Unsubscribe {
    const set = (this.handlers[event] ??= new Set());
    set.add(handler as any);
    return () => set.delete(handler as any);
  }
  emit<E extends AgentSessionEvent>(event: E, payload: AgentSessionEventMap[E]) {
    const set = this.handlers[event];
    if (!set) return;
    for (const h of set) h(payload);
  }
}

describe('AgentEventBridge', () => {
  test('publishes agent events and session events', async () => {
    const manager = {
      getAllAgents: async () => ({ items: [], nextCursor: '' }),
      getAgent: async () => null,
    } as any;
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
    session.emit('status', { state: 'running' } as any);
    session.emit('message', { message: { messageId: 'm1' } } as any);
    session.emit('error', { error: new Error('e') } as any);

    expect(publisher.calls.some((c) => c.channel.endsWith('/status'))).toBe(true);
    expect(publisher.calls.some((c) => c.channel.endsWith('/message'))).toBe(true);
    expect(publisher.calls.some((c) => c.channel.endsWith('/error'))).toBe(true);
  });
});
