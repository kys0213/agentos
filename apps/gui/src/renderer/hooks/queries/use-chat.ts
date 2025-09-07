import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';
import { ServiceContainer } from '../../../shared/di/service-container';

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
      return [];
    },
    enabled: !!agentId,
    initialData: [],
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
      mentionedAgentIds: _mentionedAgentIds,
    }: {
      text: string;
      mentionedAgentIds?: string[];
    }) => {
      if (!agentId) {
        throw new Error('agentId is required');
      }

      const agentService = ServiceContainer.getOrThrow('agent');

      // 유저 메시지
      const userMessage: Readonly<MessageHistory> = {
        messageId: `user-${Date.now()}`,
        role: 'user',
        content: [{ contentType: 'text', value: text }],
        createdAt: new Date(),
      } as const;

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
        [{ role: 'user', content: [{ contentType: 'text', value: text }] }],
        {
          // 세션 ID 우선 사용, 없으면 agentId로 폴백
          sessionId: options?.sessionId ?? agentId,
          maxTurnCount: 1,
        }
      );

      // 응답 메시지들을 MessageHistory로 매핑 (배열 콘텐츠로 정규화)
      type BridgeMsg = {
        role: string;
        content: { contentType: string; value: unknown }[];
      } & Record<string, unknown>;

      const assistantMessages: Readonly<MessageHistory>[] = result.messages.map(
        (m: BridgeMsg, idx) => {
          const serverMsgId =
            typeof m['messageId'] === 'string' ? (m['messageId'] as string) : undefined;
          const createdRaw = m['createdAt'];
          let createdAt: Date;
          if (createdRaw instanceof Date) {
            createdAt = createdRaw;
          } else if (typeof createdRaw === 'string') {
            createdAt = new Date(createdRaw);
          } else {
            createdAt = new Date();
          }

          const common = {
            messageId: serverMsgId ?? `assistant-${result.sessionId}-${Date.now()}-${idx}`,
            role: m.role,
            content: m.content,
            createdAt,
          };

          if (m.role === 'tool') {
            const name = typeof m['name'] === 'string' ? (m['name'] as string) : '';
            const toolCallId =
              typeof m['toolCallId'] === 'string' ? (m['toolCallId'] as string) : '';
            return {
              ...common,
              name,
              toolCallId,
              isCompressed: false,
              agentMetadata: undefined,
            } as Readonly<MessageHistory>;
          }
          return common as Readonly<MessageHistory>;
        }
      );

      // 세션 ID 갱신 콜백 (서버에서 새 세션 발급 시 반영)
      options?.onSessionId?.(result.sessionId);

      return { userMessage, assistantMessages } as const;
    },
    onSuccess: ({ assistantMessages }) => {
      if (!agentId) {
        return;
      }
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(agentId),
        (prev?: Readonly<MessageHistory>[]) => [...(prev ?? []), ...assistantMessages]
      );
    },
  });
};
