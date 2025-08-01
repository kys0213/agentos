import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Services } from '../../bootstrap';
import type { ChatSessionDescription, Preset } from '../../types/core-types';

// Query Keys
const QUERY_KEYS = {
  chatSessions: ['chatSessions'] as const,
  chatSession: (id: string) => ['chatSession', id] as const,
  messages: (sessionId: string) => ['messages', sessionId] as const,
} as const;

// 채팅 세션 목록 조회
export const useChatSessions = () => {
  const chatService = Services.getChat();

  return useQuery({
    queryKey: QUERY_KEYS.chatSessions,
    queryFn: () => chatService.listSessions(),
    staleTime: 30000, // 30초
  });
};

// 새 세션 생성 뮤테이션
export const useCreateSession = () => {
  const queryClient = useQueryClient();
  const chatService = Services.getChat();

  return useMutation({
    mutationFn: (preset?: Preset) => chatService.createSession(preset ? { preset } : undefined),
    onSuccess: () => {
      // 세션 목록 무효화하여 refetch 트리거
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions });
    },
  });
};

// 세션 메시지 조회
export const useSessionMessages = (sessionId: string | null) => {
  const chatService = Services.getChat();

  return useQuery({
    queryKey: QUERY_KEYS.messages(sessionId || ''),
    queryFn: () =>
      sessionId
        ? chatService.getMessages(sessionId)
        : Promise.resolve({ messages: [], hasMore: false, nextCursor: undefined }),
    enabled: !!sessionId, // sessionId가 있을 때만 쿼리 실행
    staleTime: 10000, // 메시지는 더 자주 업데이트되므로 10초
  });
};

// 메시지 전송 뮤테이션
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  const chatService = Services.getChat();

  return useMutation({
    mutationFn: ({ sessionId, text }: { sessionId: string; text: string }) =>
      chatService.sendMessage(sessionId, text),
    onSuccess: (_, { sessionId }) => {
      // 해당 세션의 메시지 무효화
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(sessionId),
      });
      // 세션 목록도 무효화 (최근 메시지 시간 등이 변경될 수 있음)
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.chatSessions,
      });
    },
  });
};

// 세션 삭제 뮤테이션
export const useDeleteSession = () => {
  const queryClient = useQueryClient();
  const chatService = Services.getChat();

  return useMutation({
    mutationFn: (sessionId: string) => chatService.deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.chatSessions });
    },
  });
};

// 유틸리티: 특정 세션 캐시 제거
export const useInvalidateSession = () => {
  const queryClient = useQueryClient();

  return (sessionId: string) => {
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.messages(sessionId),
    });
  };
};
