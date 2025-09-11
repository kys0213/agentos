import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ServiceContainer } from '../../../shared/di/service-container';

export const CHAT_SESSION_QUERY_KEYS = {
  list: ['chat', 'sessions'] as const,
  session: (sessionId: string) => ['chat', 'session', sessionId] as const,
} as const;

export interface ChatSessionItem {
  id: string;
  title: string;
  updatedAt: Date;
}

export const useChatSessions = (pagination?: {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
}) => {
  return useQuery({
    queryKey: [...CHAT_SESSION_QUERY_KEYS.list, pagination],
    queryFn: async () => {
      const conversationService = ServiceContainer.getOrThrow('conversation');
      const result = await conversationService.listSessions(pagination);

      return {
        items: result.items.map((item) => ({
          ...item,
          updatedAt: new Date(item.updatedAt),
        })),
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
      };
    },
    staleTime: 30_000,
  });
};

export const useDeleteChatSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const conversationService = ServiceContainer.getOrThrow('conversation');
      return conversationService.deleteSession(sessionId);
    },
    onSuccess: (data, sessionId) => {
      if (data.success) {
        // Invalidate chat sessions list
        queryClient.invalidateQueries({
          queryKey: CHAT_SESSION_QUERY_KEYS.list,
        });

        // Remove session from cache
        queryClient.removeQueries({
          queryKey: CHAT_SESSION_QUERY_KEYS.session(sessionId),
        });
      }
    },
  });
};

// GUI 전용 상태 관리 (localStorage)
export interface GuiChatState {
  sessionId: string;
  isPinned: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  displayOrder?: number;
}

const GUI_CHAT_STATE_KEY = 'gui-chat-states';

export const useGuiChatStates = () => {
  return useQuery({
    queryKey: ['gui', 'chat', 'states'],
    queryFn: async (): Promise<GuiChatState[]> => {
      const storedData = localStorage.getItem(GUI_CHAT_STATE_KEY);
      if (!storedData) {
        return [];
      }

      try {
        const states = JSON.parse(storedData) as GuiChatState[];
        return states.map((state) => ({
          ...state,
          archivedAt: state.archivedAt ? new Date(state.archivedAt) : undefined,
        }));
      } catch {
        return [];
      }
    },
    staleTime: Infinity, // localStorage data doesn't expire
  });
};

export const useUpdateGuiChatState = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (update: Partial<GuiChatState> & { sessionId: string }) => {
      const currentStates =
        queryClient.getQueryData<GuiChatState[]>(['gui', 'chat', 'states']) || [];

      const updatedStates = currentStates.some((state) => state.sessionId === update.sessionId)
        ? currentStates.map((state) =>
            state.sessionId === update.sessionId ? { ...state, ...update } : state
          )
        : [...currentStates, { isPinned: false, isArchived: false, ...update } as GuiChatState];

      localStorage.setItem(GUI_CHAT_STATE_KEY, JSON.stringify(updatedStates));

      return updatedStates;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['gui', 'chat', 'states'], data);
    },
  });
};
