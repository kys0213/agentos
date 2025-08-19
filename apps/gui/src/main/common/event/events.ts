import { z } from 'zod';

export const AgentSessionMessageEvent = z.object({
  type: z.literal('agent.session.message'),
  payload: z.object({
    sessionId: z.string(),
    // Allow any message shape; renderer can narrow further
    data: z.unknown(),
  }),
  ts: z.number().optional(),
});

export const AgentSessionEndedEvent = z.object({
  type: z.literal('agent.session.ended'),
  payload: z.object({
    sessionId: z.string(),
  }),
  ts: z.number().optional(),
});

export const AgentOutboundEvent = z.union([AgentSessionMessageEvent, AgentSessionEndedEvent]);

export type AgentOutboundEvent = z.infer<typeof AgentOutboundEvent>;

export function isAgentOutboundEvent(ev: unknown): ev is AgentOutboundEvent {
  return AgentOutboundEvent.safeParse(ev).success;
}
