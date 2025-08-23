import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';
import { normalizeToArrayContent } from './normalize';
import { ServiceContainer } from '../../ipc/service-container';

export const CHAT_QUERY_KEYS = {
  mentionableAgents: ['chat', 'mentionableAgents'] as const,
  activeAgents: ['chat', 'activeAgents'] as const,
  history: (agentId: string) => ['chat', 'history', agentId] as const,
} as const;

export const useMentionableAgents = () => {
  return useQuery<ReadonlyAgentMetadata[]>({
    queryKey: CHAT_QUERY_KEYS.mentionableAgents,
    queryFn: async () => {
      const agentService = ServiceContainer.getOrThrow('agent');
      const all = await agentService.getAllAgentMetadatas();
      return all.filter((a) => a.status === 'active' || a.status === 'idle');
    },
    staleTime: 60_000,
  });
};

export const useActiveAgents = () => {
  return useQuery<ReadonlyAgentMetadata[]>({
    queryKey: CHAT_QUERY_KEYS.activeAgents,
    queryFn: async () => {
      const agentService = ServiceContainer.getOrThrow('agent');
      const all = await agentService.getAllAgentMetadatas();
      return all.filter((a) => a.status === 'active');
    },
    staleTime: 30_000,
  });
};

export const useChatHistory = (agentId: string | undefined) => {
  return useQuery<Readonly<MessageHistory>[]>({
    queryKey: agentId ? CHAT_QUERY_KEYS.history(agentId) : ['chat', 'history', 'disabled'],
    queryFn: async () => {
      // 서버 저장 없음: 초기 빈 배열. 전송 시 캐시에 append.
      return [] as Readonly<MessageHistory>[];
    },
    enabled: !!agentId,
    initialData: [] as Readonly<MessageHistory>[],
  });
};

export const useSendChatMessage = (
  agentId: string | undefined,
  options?: { sessionId?: string; onSessionId?: (id: string) => void }
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      text,
      _mentionedAgentIds,
    }: {
      text: string;
      _mentionedAgentIds?: string[];
    }) => {
      if (!agentId) throw new Error('agentId is required');

      const agentService = ServiceContainer.getOrThrow('agent');

      // 유저 메시지
      const userMessage: MessageHistory = {
        messageId: `user-${Date.now()}`,
        role: 'user',
        content: { contentType: 'text', value: text },
        createdAt: new Date(),
      };

      // 캐시에 유저 메시지 먼저 추가 (낙관적)
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(agentId),
        (prev?: Readonly<MessageHistory>[]) => {
          const history = prev ?? [];
          return [...history, userMessage];
        }
      );

      // AgentProtocol.chat 호출
      const result = await agentService.chat(
        agentId,
        [{ role: 'user', content: { contentType: 'text', value: text } }],
        {
          // 세션 ID 우선 사용, 없으면 agentId로 폴백
          sessionId: options?.sessionId ?? agentId,
          maxTurnCount: 1,
        }
      );

      // 응답 메시지들을 MessageHistory로 매핑 (배열 콘텐츠로 정규화)
      const assistantMessages: MessageHistory[] = result.messages.map((m, idx): MessageHistory => {
        const content = normalizeToArrayContent(m);

        if (m.role === 'tool') {
          return {
            messageId: `assistant-${result.sessionId}-${Date.now()}-${idx}`,
            role: m.role,
            content,
            createdAt: new Date(),
            name: m.role === 'tool' ? m.name : '',
            toolCallId: m.role === 'tool' ? m.toolCallId : '',
            isCompressed: false,
            agentMetadata: undefined,
          };
        } else {
          return {
            messageId: `assistant-${result.sessionId}-${Date.now()}-${idx}`,
            role: m.role,
            content: content[0],
            createdAt: new Date(),
          };
        }
      });

      // 세션 ID 갱신 콜백 (서버에서 새 세션 발급 시 반영)
      options?.onSessionId?.(result.sessionId);

      return { userMessage, assistantMessages } as const;
    },
    onSuccess: ({ assistantMessages }) => {
      if (!agentId) return;
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(agentId),
        (prev?: Readonly<MessageHistory>[]) => [...(prev ?? []), ...assistantMessages]
      );
    },
  });
};
