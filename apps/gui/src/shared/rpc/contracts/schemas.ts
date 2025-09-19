import { z } from 'zod';

// 내부 zod 스키마는 Core 정의를 그대로 복제해 브라우저 번들에서는
// Node 의존성(`fs`)을 끌어오지 않도록 한다. Core 변경 시 여기 역시 동기화 필요.
export const MultiModalContentSchema = z.object({
  contentType: z.string(),
  value: z.unknown(),
});

const MessageSchema = z.object({
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

export const CursorPaginationSchema = z.object({
  cursor: z.string().default(''),
  limit: z.number().int().positive().default(20),
  direction: z.union([z.literal('forward'), z.literal('backward')]).default('forward'),
});

export const ChatSessionDescriptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
});

export const UserMessageSchema = z.object({
  role: z.literal('user'),
  content: z.array(MultiModalContentSchema),
});

export const PageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().default(''),
    hasMore: z.boolean().default(false),
  });

export const ChatSessionPageSchema = PageOf(ChatSessionDescriptionSchema);
export const MessageHistoryPageSchema = PageOf(MessageHistorySchema);
