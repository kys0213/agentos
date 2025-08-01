import { useCallback, useEffect, useState } from 'react';
export default function useChatSession(chatManager, bridgeManager) {
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const loadHistories = useCallback(async (s) => {
    const all = [];
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
      timestamp: h.createdAt,
    }));
  }, []);
  const openSession = useCallback(
    async (id) => {
      const loaded = await chatManager.load({ sessionId: id });
      const histories = await loadHistories(loaded);
      setSession(loaded);
      setMessages(histories);
      return loaded;
    },
    [chatManager, loadHistories]
  );
  const startNewSession = useCallback(
    async (preset) => {
      const newS = await chatManager.create({ preset });
      setSession(newS);
      setMessages([]);
      return newS;
    },
    [chatManager]
  );
  const send = useCallback(
    async (text) => {
      if (!session) return;
      const userMsg = { sender: 'user', text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      await session.appendMessage({
        role: 'user',
        content: { contentType: 'text', value: text },
      });
      const llmResponse = await bridgeManager
        .getCurrentBridge()
        .invoke({ messages: [{ role: 'user', content: { contentType: 'text', value: text } }] });
      const content = llmResponse.content;
      const reply = content.contentType === 'text' ? String(content.value) : '';
      const agentMsg = { sender: 'agent', text: reply, timestamp: new Date() };
      setMessages((prev) => [...prev, agentMsg]);
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
