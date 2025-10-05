import { z } from 'zod';
import { defineContract } from './defineContract';
import { CursorPaginationSchema, ChatSessionPageSchema, MessageHistoryPageSchema } from './schemas';

export const ChatContract = defineContract({
  namespace: 'chat',
  methods: {
    listSessions: {
      channel: 'chat.list-sessions',
      payload: z.object({
        agentId: z.string(),
        pagination: CursorPaginationSchema.optional(),
      }),
      response: ChatSessionPageSchema,
    },
    getMessages: {
      channel: 'chat.get-messages',
      payload: z.object({
        agentId: z.string(),
        sessionId: z.string(),
        pagination: CursorPaginationSchema.optional(),
      }),
      response: MessageHistoryPageSchema,
    },
    deleteSession: {
      channel: 'chat.delete-session',
      payload: z.object({
        agentId: z.string(),
        sessionId: z.string(),
      }),
      response: z.object({ success: z.boolean(), error: z.string().optional() }),
    },
  },
});
