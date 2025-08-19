import { Injectable } from '@nestjs/common';
import type { Message } from 'llm-bridge-spec';
import { OutboundChannel, OutboundEvent } from '../../common/event/outbound-channel';
import { Observable, map } from 'rxjs';

export type AgentEventKind =
  | 'agent.session.created'
  | 'agent.session.ended'
  | 'agent.session.message'
  | 'agent.status.changed'
  | 'agent.token.delta';

export type AgentEventPayload =
  | { sessionId: string; agentId: string }
  | { sessionId: string }
  | { sessionId: string; message: Message }
  | { agentId: string; status: 'active' | 'idle' | 'inactive' | 'error' }
  | { sessionId: string; delta: { text?: string; tokens?: number } };

@Injectable()
export class AgentEventBridge {
  constructor(private readonly outbound: OutboundChannel) {}

  publishSessionCreated(sessionId: string, agentId: string) {
    this.outbound.emit<AgentEventPayload>({ type: 'agent.session.created', payload: { sessionId, agentId } });
  }

  publishSessionEnded(sessionId: string) {
    this.outbound.emit<AgentEventPayload>({ type: 'agent.session.ended', payload: { sessionId } });
  }

  publishSessionMessage(sessionId: string, message: Message) {
    this.outbound.emit<AgentEventPayload>({ type: 'agent.session.message', payload: { sessionId, message } });
  }

  publishStatusChanged(agentId: string, status: 'active' | 'idle' | 'inactive' | 'error') {
    this.outbound.emit<AgentEventPayload>({ type: 'agent.status.changed', payload: { agentId, status } });
  }

  stream(): Observable<OutboundEvent<AgentEventPayload>> {
    return this.outbound.ofType(/^agent\./);
  }
}
