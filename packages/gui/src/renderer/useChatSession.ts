import { useCallback, useEffect, useState } from 'react';
import { ChatManager, ChatSession, MessageHistory, Preset } from '@agentos/core';
import { BridgeManager } from './BridgeManager';
import { Message } from './ChatMessageList';

export interface UseChatSession {
  session: ChatSession | null;
  openSession(id: string): Promise<ChatSession>;
  startNewSession(preset?: Preset): Promise<ChatSession>;
  messages: Message[];
  send(text: string): Promise<void>;
}

export default function useChatSession(
  chatManager: ChatManager,
  bridgeManager: BridgeManager
): UseChatSession {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadHistories = useCallback(async (s: ChatSession) => {
    const all: MessageHistory[] = [];
    let cursor = '';
    for (;;) {
      const { items, nextCursor } = await s.getHistories({
        cursor,
        limit: 20,
        direction: 'forward',
      });
      all.push(...items);
      if (!nextCursor || items.length === 0) break;
      cursor = nextCursor;
    }
    return all.map((h) => ({
      sender: h.role === 'user' ? 'user' : 'agent',
      text:
        !Array.isArray(h.content) && h.content.contentType === 'text'
          ? String(h.content.value)
          : '',
    }));
  }, []);

  const openSession = useCallback(
    async (id: string) => {
      const loaded = await chatManager.load({ sessionId: id });
      const histories = await loadHistories(loaded);
      setSession(loaded);
      setMessages(histories);
      return loaded;
    },
    [chatManager, loadHistories]
  );

  const startNewSession = useCallback(
    async (preset?: Preset) => {
      const newS = await chatManager.create({ preset });
      setSession(newS);
      setMessages([]);
      return newS;
    },
    [chatManager]
  );

  const send = useCallback(
    async (text: string) => {
      if (!session) return;
      setMessages((prev) => [...prev, { sender: 'user', text }]);
      await session.appendMessage({
        role: 'user',
        content: { contentType: 'text', value: text },
      });
      const llmResponse = await bridgeManager
        .getCurrentBridge()
        .invoke({ messages: [{ role: 'user', content: { contentType: 'text', value: text } }] });
      const content = llmResponse.content;
      const reply = content.contentType === 'text' ? String(content.value) : '';
      setMessages((prev) => [...prev, { sender: 'agent', text: reply }]);
      await session.appendMessage({
        role: 'assistant',
        content: { contentType: 'text', value: reply },
      });
      await session.commit();
    },
    [bridgeManager, session]
  );

  useEffect(() => {
    // initialize on mount with a new session
    const init = async () => {
      const newS = await chatManager.create({});
      setSession(newS);
    };
    void init();
  }, [chatManager]);

  return { session, openSession, startNewSession, messages, send };
}
