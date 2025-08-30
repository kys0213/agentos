import { useQuery } from '@tanstack/react-query';
import type {
  ChatSessionDescription,
  CursorPagination,
  CursorPaginationResult,
} from '@agentos/core';
import { ServiceContainer } from '../../../shared/di/service-container';

export const CONVERSATION_QUERY_KEYS = {
  sessions: ['conversation', 'sessions'] as const,
  messages: (sessionId: string, cursor?: string) =>
    ['conversation', 'messages', sessionId, cursor ?? ''] as const,
} as const;

// Minimal contract-aligned message shape (server does not persist tool extensions)
type MinimalMessage = Readonly<{
  messageId: string;
  createdAt: Date;
  role: string;
  content: { contentType: string; value: unknown }[];
}>;

export function useSessionList(pagination?: CursorPagination) {
  return useQuery<CursorPaginationResult<ChatSessionDescription>>({
    queryKey: CONVERSATION_QUERY_KEYS.sessions,
    queryFn: async () => {
      const svc = ServiceContainer.getOrThrow('conversation');
      return await svc.listSessions(pagination);
    },
    staleTime: 30_000,
  });
}

export function useSessionMessages(sessionId: string | undefined, pagination?: CursorPagination) {
  return useQuery<CursorPaginationResult<MinimalMessage> | null>({
    queryKey: sessionId
      ? CONVERSATION_QUERY_KEYS.messages(sessionId, pagination?.cursor)
      : ['conversation', 'messages', 'disabled'],
    queryFn: async () => {
      if (!sessionId) {
        return null;
      }
      const svc = ServiceContainer.getOrThrow('conversation');
      return (await svc.getMessages(
        sessionId,
        pagination
      )) as CursorPaginationResult<MinimalMessage>;
    },
    enabled: !!sessionId,
    staleTime: 10_000,
    initialData: null,
  });
}
// All calls are typed via adapters; no any required
