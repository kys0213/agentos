import { Injectable } from '@nestjs/common';
import type { Message } from 'llm-bridge-spec';
import { OutboundChannel } from '../../common/event/outbound-channel';
import { Observable, map } from 'rxjs';

export type AgentEventEnvelope = {
  type:
    | 'agent.session.created'
    | 'agent.session.ended'
    | 'agent.session.message'
    | 'agent.status.changed'
    | 'agent.token.delta'
    | string; // forward compatibility
  payload: unknown;
  ts?: number;
};

@Injectable()
export class AgentEventBridge {
  constructor(private readonly outbound: OutboundChannel) {}

  publishSessionCreated(sessionId: string, agentId: string) {
    this.outbound.emit<AgentEventEnvelope>({
      type: 'agent.session.created',
      payload: { sessionId, agentId },
    });
  }

  publishSessionEnded(sessionId: string) {
    this.outbound.emit<AgentEventEnvelope>({
      type: 'agent.session.ended',
      payload: { sessionId },
    });
  }

  publishSessionMessage(sessionId: string, message: Message) {
    this.outbound.emit<AgentEventEnvelope>({
      type: 'agent.session.message',
      payload: { sessionId, message },
    });
  }

  publishStatusChanged(agentId: string, status: 'active' | 'idle' | 'inactive' | 'error') {
    this.outbound.emit<AgentEventEnvelope>({
      type: 'agent.status.changed',
      payload: { agentId, status },
    });
  }

  stream(): Observable<AgentEventEnvelope> {
    return this.outbound.ofType('agent.').pipe(map((ev) => ev as AgentEventEnvelope));
  }
}

