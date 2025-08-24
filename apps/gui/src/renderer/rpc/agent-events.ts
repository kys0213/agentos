import type { Observable, Subscription } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import type { RpcFrame } from '../../shared/rpc/rpc-frame';
import { selectDataByMethod } from './frame-channel';
import {
  AgentOutboundEvent,
  AgentSessionMessageEvent,
  AgentSessionEndedEvent,
} from '../../main/common/event/events';
import { z } from 'zod';

type AgentSessionMessagePayload = z.infer<typeof AgentSessionMessageEvent>['payload'];
type AgentSessionEndedPayload = z.infer<typeof AgentSessionEndedEvent>['payload'];

export type AgentEventHandlers = {
  onMessage?: (p: AgentSessionMessagePayload) => void;
  onEnded?: (p: AgentSessionEndedPayload) => void;
};

export function wireAgentEvents(
  frames$: Observable<RpcFrame>,
  handlers: AgentEventHandlers
): Subscription {
  const agent$ = frames$.pipe(selectDataByMethod('agent.'));
  return agent$
    .pipe(
      map((ev) => AgentOutboundEvent.safeParse(ev)),
      filter((res) => res.success),
      map((res) => res.data)
    )
    .subscribe((ev) => {
      switch (ev.type) {
        case 'agent.session.message':
          handlers.onMessage?.(ev.payload);
          break;
        case 'agent.session.ended':
          handlers.onEnded?.(ev.payload);
          break;
      }
    });
}
