import { z } from 'zod';
import { defineContract } from './defineContract';
import { MultiModalContentSchema, UserMessageSchema } from './schemas';
import { agentMetadataSchema } from '../../schema/agent.schemas';

// Bridge-level message (llm-bridge-spec compatible, minimal)
const BridgeMessageSchema = z.object({
  role: z.string(),
  content: z.array(MultiModalContentSchema),
});

// Agent chat result
const AgentChatResultSchema = z.object({
  messages: z.array(BridgeMessageSchema),
  sessionId: z.string(),
});

// Options passed over transport (AbortSignal omitted)
const AgentExecuteOptionsSchema = z.object({
  sessionId: z.string().optional(),
  timeout: z.number().int().positive().optional(),
  maxTurnCount: z.number().int().positive().optional(),
});

// Metadata output shape (extend shared schema with id; allow passthrough for forward-compat)
const AgentMetadataOutSchema = z
  .object({ id: z.string() })
  .merge(agentMetadataSchema)
  .passthrough();

export const AgentContract = defineContract({
  namespace: 'agent',
  methods: {
    chat: {
      channel: 'agent.chat',
      payload: z.object({
        agentId: z.string(),
        messages: z.array(UserMessageSchema),
        options: AgentExecuteOptionsSchema.optional(),
      }),
      response: AgentChatResultSchema,
    },
    'end-session': {
      channel: 'agent.end-session',
      payload: z.object({ agentId: z.string(), sessionId: z.string() }),
    },
    'get-metadata': {
      channel: 'agent.get-metadata',
      payload: z.string(),
      response: AgentMetadataOutSchema,
    },
    'get-all-metadatas': {
      channel: 'agent.get-all-metadatas',
      response: z.array(AgentMetadataOutSchema),
    },
    update: {
      channel: 'agent.update',
      payload: z.object({ agentId: z.string(), patch: z.record(z.unknown()) }),
      response: AgentMetadataOutSchema,
    },
    create: {
      channel: 'agent.create',
      payload: z.record(z.unknown()),
      response: AgentMetadataOutSchema,
    },
    delete: {
      channel: 'agent.delete',
      payload: z.string(),
      response: AgentMetadataOutSchema,
    },
  },
});
