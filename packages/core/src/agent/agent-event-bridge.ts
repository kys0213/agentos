import type { AgentManager } from './agent-manager';
import type { Agent } from './agent';
import type { AgentSession, AgentSessionEvent, AgentSessionEventMap } from './agent-session';
import type { EventPublisher } from '../common/event/event-publisher';
import type { EventfulAgent, AgentEvent } from './agent-events';

type Unsub = () => void;

export class AgentEventBridge {
  private readonly unsubs = new Map<string, Unsub[]>();

  constructor(
    private readonly manager: AgentManager,
    private readonly publisher: EventPublisher
  ) {}

  async attachAll(options?: { pageSize?: number }) {
    const limit = options?.pageSize ?? 1000;
    let cursor = '';
    // naive pagination loop
    while (true) {
      const page = await this.manager.getAllAgents({ limit, cursor });
      for (const agent of page.items) await this.attachAgent(agent);
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
    }
  }

  async attachAgent(agentOrId: Agent | string) {
    const agent =
      typeof agentOrId === 'string' ? await this.manager.getAgent(agentOrId) : agentOrId;
    if (!agent) return;

    const supportsEvents = (agent as any as Partial<EventfulAgent>).on;
    if (!supportsEvents) return;

    const unsubs: Unsub[] = [];
    const off = (agent as any as EventfulAgent).on((e) => this.onAgentEvent(agent.id, e));
    unsubs.push(off);
    this.unsubs.set(agent.id, unsubs);
  }

  detachAgent(agentId: string) {
    const list = this.unsubs.get(agentId);
    if (list) list.forEach((u) => u());
    this.unsubs.delete(agentId);
  }

  private onAgentEvent(agentId: string, event: AgentEvent) {
    switch (event.type) {
      case 'statusChanged':
        this.publisher.publish('agent/status', { agentId, status: event.status });
        break;
      case 'metadataUpdated':
        this.publisher.publish('agent/change', { agentId, patch: event.patch });
        break;
      case 'sessionCreated':
        this.publisher.publish('agent/session/created', { agentId, sessionId: event.sessionId });
        // Best effort: attach session events if we can obtain the session instance later from callers
        break;
      case 'sessionEnded':
        this.publisher.publish('agent/session/ended', {
          agentId,
          sessionId: event.sessionId,
          reason: event.reason,
        });
        break;
      case 'error':
        this.publisher.publish('agent/error', {
          agentId,
          error: { message: event.error.message },
        });
        break;
    }
  }

  attachSession(agentId: string, session: AgentSession) {
    const key = `${agentId}:${session.sessionId}`;
    const list = this.unsubs.get(key) ?? [];
    const add = <E extends AgentSessionEvent>(
      event: E,
      toPayload: (p: AgentSessionEventMap[E]) => unknown,
      channel: string
    ) => {
      const off = session.on(event, (p) => this.publisher.publish(channel, toPayload(p)));
      list.push(off);
    };

    add(
      'status',
      (p) => ({ agentId, sessionId: session.sessionId, ...p }),
      `agent/session/${session.sessionId}/status`
    );
    add(
      'message',
      (p) => ({ agentId, sessionId: session.sessionId, message: p.message }),
      `agent/session/${session.sessionId}/message`
    );
    add(
      'error',
      (p) => ({ agentId, sessionId: session.sessionId, error: { message: p.error.message } }),
      `agent/session/${session.sessionId}/error`
    );
    add(
      'terminated',
      (p) => ({ agentId, sessionId: session.sessionId, ...p }),
      `agent/session/${session.sessionId}/status`
    );
    add(
      'promptRequest',
      (p) => ({ agentId, sessionId: session.sessionId, ...p }),
      `agent/session/${session.sessionId}/promptRequest`
    );
    add(
      'consentRequest',
      (p) => ({ agentId, sessionId: session.sessionId, ...p }),
      `agent/session/${session.sessionId}/consentRequest`
    );
    add(
      'sensitiveInputRequest',
      (p) => ({ agentId, sessionId: session.sessionId, ...p }),
      `agent/session/${session.sessionId}/sensitiveInputRequest`
    );

    this.unsubs.set(key, list);
  }

  detachSession(agentId: string, sessionId: string) {
    const key = `${agentId}:${sessionId}`;
    const list = this.unsubs.get(key);
    if (list) list.forEach((u) => u());
    this.unsubs.delete(key);
  }
}
