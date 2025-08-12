import { useQuery } from '@tanstack/react-query';
import type {
  ChatSessionDescription,
  CursorPagination,
  CursorPaginationResult,
  MessageHistory,
} from '@agentos/core';
import { ServiceContainer } from '../../../shared/ipc/service-container';

export const CONVERSATION_QUERY_KEYS = {
  sessions: ['conversation', 'sessions'] as const,
  messages: (sessionId: string, cursor?: string) =>
    ['conversation', 'messages', sessionId, cursor ?? ''] as const,
} as const;

export function useSessionList(pagination?: CursorPagination) {
  return useQuery<CursorPaginationResult<ChatSessionDescription>>({
    queryKey: CONVERSATION_QUERY_KEYS.sessions,
    queryFn: async () => {
      const svc = ServiceContainer.getOrThrow('conversation');
      return svc.listSessions(pagination);
    },
    staleTime: 30_000,
  });
}

export function useSessionMessages(sessionId: string | undefined, pagination?: CursorPagination) {
  return useQuery<CursorPaginationResult<Readonly<MessageHistory>> | null>({
    queryKey: sessionId
      ? CONVERSATION_QUERY_KEYS.messages(sessionId, pagination?.cursor)
      : ['conversation', 'messages', 'disabled'],
    queryFn: async () => {
      if (!sessionId) return null;
      const svc = ServiceContainer.getOrThrow('conversation');
      return svc.getMessages(sessionId, pagination);
    },
    enabled: !!sessionId,
    staleTime: 10_000,
    initialData: null,
  });
}

