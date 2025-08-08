import { useState } from 'react';
import type {
  DesignChatAgent,
  DesignAgent,
  UseChatStateReturn,
} from '../types/design-types';

/**
 * Chat state management hook
 * ServiceContainer 기반으로 재작성된 버전
 * 새 디자인의 채팅 상태 로직을 Core 타입과 호환되도록 구현
 */
export function useChatState(): UseChatStateReturn {
  const [activeChatAgent, setActiveChatAgent] = useState<DesignChatAgent | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<DesignChatAgent[]>([]);

  const handleOpenChat = (agent: DesignAgent) => {
    // DesignAgent를 DesignChatAgent로 변환
    const chatAgent: DesignChatAgent = {
      id: parseInt(agent.id) || Date.now(), // string id를 number로 변환
      name: agent.name,
      preset: agent.preset,
    };
    
    setActiveChatAgent(chatAgent);
    
    // 최소화된 채팅에서 제거 (이미 열려있던 경우)
    setMinimizedChats(prev => 
      prev.filter(chat => chat.id !== chatAgent.id)
    );
  };

  const handleCloseChat = () => {
    setActiveChatAgent(null);
  };

  const handleMinimizeChat = () => {
    if (activeChatAgent) {
      setMinimizedChats(prev => {
        // 이미 최소화된 채팅에 없는 경우에만 추가
        const exists = prev.some(chat => chat.id === activeChatAgent.id);
        if (!exists) {
          return [...prev, activeChatAgent];
        }
        return prev;
      });
      setActiveChatAgent(null);
    }
  };

  const handleRestoreChat = (chat: DesignChatAgent) => {
    setActiveChatAgent(chat);
    setMinimizedChats(prev => 
      prev.filter(c => c.id !== chat.id)
    );
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