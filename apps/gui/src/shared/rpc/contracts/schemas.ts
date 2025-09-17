import { z } from 'zod';
import { MessageHistorySchema, MultiModalContentSchema } from '@agentos/core';

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

export { MessageHistorySchema, MultiModalContentSchema };
