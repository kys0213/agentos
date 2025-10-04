import { useQuery } from '@tanstack/react-query';
import type {
  ChatSessionDescription,
  CursorPagination,
  CursorPaginationResult,
} from '@agentos/core';
import { ServiceContainer } from '../../../shared/di/service-container';
import type { z } from 'zod';
import { MessageHistoryPageSchema } from '../../../shared/rpc/contracts/schemas';

export const CONVERSATION_QUERY_KEYS = {
  sessions: ['conversation', 'sessions'] as const,
  messages: (sessionId: string, cursor?: string) =>
    ['conversation', 'messages', sessionId, cursor ?? ''] as const,
} as const;

// 계약 파생 타입은 페이지 스키마 사용으로 대체됨

export function useSessionList(agentId: string, pagination?: CursorPagination) {
  return useQuery<CursorPaginationResult<ChatSessionDescription>>({
    queryKey: [...CONVERSATION_QUERY_KEYS.sessions, agentId, pagination],
    queryFn: async () => {
      const svc = ServiceContainer.getOrThrow('conversation');
      return await svc.listSessions(agentId, pagination);
    },
    staleTime: 30_000,
  });
}

export function useSessionMessages(
  agentId: string | undefined,
  sessionId: string | undefined,
  pagination?: CursorPagination
) {
  return useQuery<z.output<typeof MessageHistoryPageSchema> | null>({
    queryKey: sessionId
      ? CONVERSATION_QUERY_KEYS.messages(sessionId, pagination?.cursor)
      : ['conversation', 'messages', 'disabled'],
    queryFn: async () => {
      if (!agentId || !sessionId) {
        return null;
      }
      const svc = ServiceContainer.getOrThrow('conversation');
      return await svc.getMessages(agentId, sessionId, pagination);
    },
    enabled: !!agentId && !!sessionId,
    staleTime: 10_000,
    initialData: null,
  });
}
// All calls are typed via adapters; no any required
