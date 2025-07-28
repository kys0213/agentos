import { useCallback, useEffect, useState } from 'react';
import { chatService } from '../services/chat-service';
import { BridgeManager } from '../utils/BridgeManager';
import { Message } from '../components/ChatMessageList';
import type { Preset } from '../types/core-types';

// 새로운 IPC 기반 인터페이스
export interface UseChatSession {
  sessionId: string | null;
  messages: Message[];
  openSession(id: string): Promise<void>;
  startNewSession(preset?: Preset): Promise<void>;
  send(text: string): Promise<void>;
  isLoading: boolean;
}

export default function useChatSession(
  bridgeManager: BridgeManager
): UseChatSession {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // IPC를 통해 메시지 히스토리 로드
  const loadMessages = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      // TODO: IPC 핸들러에 메시지 조회 API 추가 필요
      // const messageHistory = await chatService.getMessages(id);
      // setMessages(messageHistory);
      
      // 임시로 빈 배열 설정 (향후 IPC API 확장 후 수정)
      setMessages([]);
    } catch (error) {
      console.error('Failed to load messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
    [loadMessages]
  );

  const startNewSession = useCallback(
    async (preset?: Preset) => {
      try {
        setIsLoading(true);
        // IPC를 통해 새 세션 생성
        const session = await chatService.createSession(preset ? { preset } : undefined);
        
        // CreateSessionResponse에서 sessionId 추출
        const newSessionId = session?.sessionId || 'new-session';
        
        setSessionId(newSessionId);
        setMessages([]);
      } catch (error) {
        console.error('Failed to start new session:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const send = useCallback(
    async (text: string) => {
      if (!sessionId) return;

      try {
        // 즉시 UI에 사용자 메시지 표시
        const userMsg: Message = { 
          sender: 'user', 
          text, 
          timestamp: new Date() 
        };
        setMessages((prev) => [...prev, userMsg]);

        // IPC를 통해 메시지 전송
        await chatService.sendMessage(sessionId, text);

        // LLM Bridge를 통해 응답 생성
        const llmResponse = await bridgeManager
          .getCurrentBridge()
          .invoke({ 
            messages: [{ 
              role: 'user', 
              content: { contentType: 'text', value: text } 
            }] 
          });

        const content = llmResponse.content;
        const reply = content.contentType === 'text' ? String(content.value) : '';
        
        // UI에 에이전트 응답 표시
        const agentMsg: Message = { 
          sender: 'agent', 
          text: reply, 
          timestamp: new Date() 
        };
        setMessages((prev) => [...prev, agentMsg]);

        // TODO: IPC를 통해 에이전트 응답도 저장
        // await chatService.saveMessage(sessionId, { role: 'assistant', content: reply });

      } catch (error) {
        console.error('Failed to send message:', error);
        // 에러 시 사용자에게 알림 (필요시 에러 메시지 표시)
      }
    },
    [bridgeManager, sessionId]
  );

  useEffect(() => {
    // 마운트 시 새 세션 초기화
    const init = async () => {
      try {
        await startNewSession();
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };
    void init();
  }, [startNewSession]);

  return { 
    sessionId, 
    messages, 
    openSession, 
    startNewSession, 
    send, 
    isLoading 
  };
}