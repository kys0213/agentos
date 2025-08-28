import { z } from 'zod';
import { defineContract } from './defineContract';

export const AgentContract = defineContract({
  namespace: 'agent',
  methods: {
    chat: {
      channel: 'agent.chat',
      payload: z.object({
        agentId: z.string(),
        messages: z.array(z.unknown()),
        options: z.record(z.unknown()).optional(),
      }),
      response: z.unknown(),
    },
    'end-session': {
      channel: 'agent.end-session',
      payload: z.object({ agentId: z.string(), sessionId: z.string() }),
    },
    'get-metadata': {
      channel: 'agent.get-metadata',
      payload: z.string(),
      response: z.unknown(),
    },
    'get-all-metadatas': {
      channel: 'agent.get-all-metadatas',
      response: z.array(z.unknown()),
    },
    update: {
      channel: 'agent.update',
      payload: z.object({ agentId: z.string(), patch: z.record(z.unknown()) }),
      response: z.unknown(),
    },
    create: {
      channel: 'agent.create',
      payload: z.record(z.unknown()),
      response: z.unknown(),
    },
    delete: {
      channel: 'agent.delete',
      payload: z.string(),
      response: z.unknown(),
    },
  },
});
