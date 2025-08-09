import { useState } from 'react';
import { ChatAgent } from '../types';

export function useChatState() {
  const [activeChatAgent, setActiveChatAgent] = useState<ChatAgent | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<ChatAgent[]>([]);

  const handleOpenChat = (agentId: number, agentName: string, agentPreset: string) => {
    setActiveChatAgent({
      id: agentId,
      name: agentName,
      preset: agentPreset,
    });
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

  const handleRestoreChat = (chat: ChatAgent) => {
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
