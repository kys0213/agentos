import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';
import { ServiceContainer } from '../../../shared/di/service-container';
import { AGENTS_QUERY_KEY, fetchAgents } from '../useAppData';

export const CHAT_QUERY_KEYS = {
  mentionableAgents: ['chat', 'mentionableAgents'] as const,
  activeAgents: ['chat', 'activeAgents'] as const,
  history: (agentId: string, sessionId: string) => ['chat', 'history', agentId, sessionId] as const,
} as const;

export const useMentionableAgents = () =>
  useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: fetchAgents,
    select: (agents: ReadonlyAgentMetadata[]) =>
      agents.filter((agent) => agent.status === 'active' || agent.status === 'idle'),
    staleTime: 60_000,
  });

export const useActiveAgents = () =>
  useQuery({
    queryKey: AGENTS_QUERY_KEY,
    queryFn: fetchAgents,
    select: (agents: ReadonlyAgentMetadata[]) =>
      agents.filter((agent) => agent.status === 'active'),
    staleTime: 30_000,
  });

export const useChatHistory = (agentId: string | undefined, sessionId?: string) =>
  useQuery<Readonly<MessageHistory>[]>({
    queryKey:
      agentId && sessionId
        ? CHAT_QUERY_KEYS.history(agentId, sessionId)
        : ['chat', 'history', 'disabled'],
    queryFn: async () => {
      if (!agentId || !sessionId) {
        return [];
      }

      const conversationService = ServiceContainer.getOrThrow('conversation');

      const allMessages: MessageHistory[] = [];
      let cursor: string | undefined;
      let hasMore = true;

      while (hasMore) {
        const result = await conversationService.getMessages(agentId, sessionId, {
          cursor: cursor || '',
          limit: 100,
          direction: 'forward',
        });

        allMessages.push(...(result.items as MessageHistory[]));
        cursor = result.nextCursor;
        hasMore = result.hasMore;
      }

      return allMessages;
    },
    enabled: !!agentId && !!sessionId,
    initialData: [],
  });

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

      const userMessage: Readonly<MessageHistory> = {
        messageId: `user-${Date.now()}`,
        role: 'user',
        content: [{ contentType: 'text', value: text }],
        createdAt: new Date(),
      } as const;

      const initialSessionKey = options?.sessionId ?? agentId;

      if (initialSessionKey) {
        queryClient.setQueryData(
          CHAT_QUERY_KEYS.history(agentId, initialSessionKey),
          (prev?: Readonly<MessageHistory>[]) => [...(prev ?? []), userMessage]
        );
      }

      const mentionedAgentIds = _mentionedAgentIds?.length
        ? _mentionedAgentIds.map((id) => id)
        : undefined;

      const result = await agentService.chat(
        agentId,
        [{ role: 'user', content: [{ contentType: 'text', value: text }] }],
        {
          sessionId: options?.sessionId ?? agentId,
          maxTurnCount: 1,
        },
        { mentionedAgentIds }
      );

      type BridgeMsg = {
        role: string;
        content: { contentType: string; value: unknown }[];
      } & Record<string, unknown>;

      const assistantMessages: Readonly<MessageHistory>[] = (result.output ?? []).map(
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

          const agentMetadata =
            m['agentMetadata'] && typeof m['agentMetadata'] === 'object'
              ? (m['agentMetadata'] as Readonly<MessageHistory>['agentMetadata'])
              : undefined;

          return {
            ...common,
            agentMetadata,
          } as Readonly<MessageHistory>;
        }
      );

      options?.onSessionId?.(result.sessionId);

      return { userMessage, assistantMessages, sessionId: result.sessionId } as const;
    },
    onSuccess: ({ assistantMessages, sessionId }) => {
      if (!agentId) {
        return;
      }
      const sessionKey = sessionId ?? options?.sessionId ?? agentId;
      if (!sessionKey) {
        return;
      }
      queryClient.setQueryData(
        CHAT_QUERY_KEYS.history(agentId, sessionKey),
        (prev?: Readonly<MessageHistory>[]) => [...(prev ?? []), ...assistantMessages]
      );
    },
  });
};
