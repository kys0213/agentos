import { useState, useCallback } from 'react';
import type { ReadonlyAgentMetadata } from '@agentos/core';
import type { UseChatStateReturn } from '../../src/renderer/types/design-types';

/**
 * Chat 상태 관리 Hook - 순수 채팅 UI 상태만 관리
 * Core 타입(ReadonlyAgentMetadata) 직접 사용
 * 비즈니스 로직은 제거하고 채팅 UI 상태만 집중 관리
 */
export function useChatState(): UseChatStateReturn {
  const [activeChatAgent, setActiveChatAgent] = useState<ReadonlyAgentMetadata | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<ReadonlyAgentMetadata[]>([]);

  // 채팅 열기 - Core AgentMetadata 객체를 직접 받아서 사용 (메모이제이션)
  const handleOpenChat = useCallback((agent: ReadonlyAgentMetadata) => {
    setActiveChatAgent(agent);
  }, []);

  // 채팅 닫기 (메모이제이션)
  const handleCloseChat = useCallback(() => {
    setActiveChatAgent(null);
  }, []);

  // 채팅 최소화 (메모이제이션)
  const handleMinimizeChat = useCallback(() => {
    if (activeChatAgent) {
      // 중복 방지: 이미 최소화된 채팅이 있는지 확인
      setMinimizedChats((prev) => {
        const alreadyMinimized = prev.some((chat) => chat.id === activeChatAgent.id);
        return alreadyMinimized ? prev : [...prev, activeChatAgent];
      });
      setActiveChatAgent(null);
    }
  }, [activeChatAgent]);

  // 채팅 복원 (메모이제이션)
  const handleRestoreChat = useCallback((agent: ReadonlyAgentMetadata) => {
    setActiveChatAgent(agent);
    setMinimizedChats((prev) => prev.filter((chat) => chat.id !== agent.id));
  }, []);

  return {
    activeChatAgent,
    minimizedChats,
    handleOpenChat,
    handleCloseChat,
    handleMinimizeChat,
    handleRestoreChat,
  };
}
