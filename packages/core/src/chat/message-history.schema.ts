import { z } from 'zod';

export const MultiModalContentSchema = z.object({
  contentType: z.string(),
  value: z.unknown(),
});

export const MessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.array(MultiModalContentSchema),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const MessageHistorySchema = MessageSchema.extend({
  messageId: z.string(),
  createdAt: z.coerce.date(),
  isCompressed: z.boolean().optional(),
  agentMetadata: z.record(z.string(), z.unknown()).optional(),
});

export type MessageHistoryFromSchema = z.infer<typeof MessageHistorySchema>;
