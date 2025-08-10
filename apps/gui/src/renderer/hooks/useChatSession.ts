import { useCallback, useState } from 'react';
import type { ChatService } from '../services/chat-service';
import type { Preset } from '@agentos/core';

// Message 타입 정의 (ChatMessageList에서 가져왔던 것)
export interface Message {
  sender: 'user' | 'agent';
  text: string;
  timestamp: Date;
}

// 새로운 IPC 기반 인터페이스
export interface UseChatSession {
  sessionId: string | null;
  messages: Message[];
  openSession(id: string): Promise<void>;
  startNewSession(preset?: Preset): Promise<string>;
  send(text: string): Promise<void>;
  isLoading: boolean;
}

export default function useChatSession(chatService: ChatService): UseChatSession {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // IPC를 통해 메시지 히스토리 로드
  const loadMessages = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        const messageResponse = await chatService.getMessages(id);

        // MessageListResponse를 Message 형태로 변환
        const convertedMessages: Message[] = messageResponse.messages.map((msg) => ({
          sender: msg.role === 'user' ? 'user' : 'agent',
          text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          timestamp: msg.timestamp,
        }));

        setMessages(convertedMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    },
    [chatService]
  );

  const openSession = useCallback(
    async (id: string) => {
      try {
        setIsLoading(true);
        // IPC를 통해 세션 로드
        await chatService.loadSession(id);
        setSessionId(id);
        await loadMessages(id);
      } catch (error) {
        console.error('Failed to open session:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loadMessages, chatService]
  );

  const startNewSession = useCallback(
    async (preset?: Preset) => {
      try {
        setIsLoading(true);
        // IPC를 통해 새 세션 생성
        const session = await chatService.createSession(preset ? { preset } : undefined);

        setSessionId(session.sessionId);
        setMessages([]);
        return session.sessionId;
      } catch (error) {
        console.error('Failed to start new session:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [chatService]
  );

  const send = useCallback(
    async (text: string) => {
      if (!sessionId) return;

      try {
        // 즉시 UI에 사용자 메시지 표시
        const userMsg: Message = {
          sender: 'user',
          text,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, userMsg]);

        // IPC를 통해 메시지 전송 (이제 응답도 함께 처리됨)
        const response = await chatService.sendMessage(sessionId, text);

        if (response.success) {
          // 메시지 전송 후 최신 메시지 히스토리 다시 로드
          await loadMessages(sessionId);
        } else {
          console.error('Failed to send message:', response.error);
        }
      } catch (error) {
        console.error('Failed to send message:', error);
        // 에러 시 사용자에게 알림 (필요시 에러 메시지 표시)
      }
    },
    [chatService, sessionId, loadMessages]
  );

  // 초기화 로직은 상위 컴포넌트에서 처리하도록 변경
  // useEffect를 제거하여 자동 세션 생성을 방지

  return {
    sessionId,
    messages,
    openSession,
    startNewSession,
    send,
    isLoading,
  };
}
