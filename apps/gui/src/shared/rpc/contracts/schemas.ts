import { z } from 'zod';

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

export const MessageHistorySchema = z.object({
  messageId: z.string(),
  createdAt: z.preprocess((v) => (typeof v === 'string' ? new Date(v) : v), z.date()),
  role: z.string(),
  content: z.array(
    z.object({
      contentType: z.string(),
      value: z.unknown(),
    })
  ),
});

export const PageOf = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    nextCursor: z.string().default(''),
    hasMore: z.boolean().default(false),
  });

export const ChatSessionPageSchema = PageOf(ChatSessionDescriptionSchema);
export const MessageHistoryPageSchema = PageOf(MessageHistorySchema);

