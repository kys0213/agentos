import { useState } from 'react';
import type { UseChatStateReturn } from '../stores/store-types';
import type { ReadonlyAgentMetadata } from '@agentos/core';

/**
 * Chat state management hook
 * ServiceContainer 기반으로 재작성된 버전
 * 새 디자인의 채팅 상태 로직을 Core 타입과 호환되도록 구현
 */
export function useChatState(): UseChatStateReturn {
  const [activeChatAgent, setActiveChatAgent] = useState<ReadonlyAgentMetadata | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<ReadonlyAgentMetadata[]>([]);

  const handleOpenChat = (agent: ReadonlyAgentMetadata) => {
    setActiveChatAgent(agent);

    // 최소화된 채팅에서 제거 (이미 열려있던 경우)
    setMinimizedChats((prev) => prev.filter((chat) => chat.id !== agent.id));
  };

  const handleCloseChat = () => {
    setActiveChatAgent(null);
  };

  const handleMinimizeChat = () => {
    if (activeChatAgent) {
      setMinimizedChats((prev) => [...prev, activeChatAgent]);
      setActiveChatAgent(null);
    }
  };

  const handleRestoreChat = (chat: ReadonlyAgentMetadata) => {
    setActiveChatAgent(chat);
    setMinimizedChats((prev) => prev.filter((c) => c.id !== chat.id));
  };

  return {
    activeChatAgent,
    minimizedChats,
    handleOpenChat,
    handleCloseChat,
    handleMinimizeChat,
    handleRestoreChat,
  };
}
