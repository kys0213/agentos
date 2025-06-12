import React from 'react';
import { BridgeManager } from './BridgeManager';
import EchoBridge from './bridges/EchoBridge';
import ReverseBridge from './bridges/ReverseBridge';
import { ChatManager, ChatSession, ChatSessionDescription, MessageHistory } from '@agentos/core';
import { createChatManager } from './chat-manager';
import ChatSidebar from './ChatSidebar';
import ChatTabs from './ChatTabs';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const manager = new BridgeManager();
manager.register('echo', new EchoBridge());
manager.register('reverse', new ReverseBridge());

const chatManager: ChatManager = createChatManager();

const ChatApp: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [bridgeId, setBridgeId] = React.useState(manager.getCurrentId()!);
  const [sessions, setSessions] = React.useState<ChatSessionDescription[]>([]);
  const [session, setSession] = React.useState<ChatSession | null>(null);
  const [openTabIds, setOpenTabIds] = React.useState<string[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string>('');
  const endRef = React.useRef<HTMLDivElement>(null);

  const refreshSessions = React.useCallback(async () => {
    const { items } = await chatManager.list();
    setSessions(items);
  }, []);

  const loadHistories = React.useCallback(async (s: ChatSession) => {
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
    return all;
  }, []);

  const openSession = React.useCallback(
    async (id: string) => {
      const loaded = await chatManager.load({ sessionId: id });
      const histories = await loadHistories(loaded);
      setSession(loaded);
      setMessages(
        histories.map((h) => ({
          sender: h.role === 'user' ? 'user' : 'agent',
          text:
            !Array.isArray(h.content) && h.content.contentType === 'text'
              ? String(h.content.value)
              : '',
        }))
      );
      setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActiveTabId(id);
    },
    [loadHistories]
  );

  const startNewSession = React.useCallback(async () => {
    const newS = await chatManager.create();
    setSession(newS);
    setMessages([]);
    setOpenTabIds((prev) => [...prev, newS.sessionId]);
    setActiveTabId(newS.sessionId);
    await refreshSessions();
  }, [refreshSessions]);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  React.useEffect(() => {
    const init = async () => {
      const newSession = await chatManager.create();
      setSession(newSession);
      setOpenTabIds([newSession.sessionId]);
      setActiveTabId(newSession.sessionId);
      await refreshSessions();
    };
    void init();
  }, []);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
    setInput('');

    if (session) {
      await session.appendMessage({
        role: 'user',
        content: { contentType: 'text', value: trimmed },
      });
    }

    try {
      setBusy(true);
      const llmResponse = await manager
        .getCurrentBridge()
        .invoke({ messages: [{ role: 'user', content: { contentType: 'text', value: trimmed } }] });
      const content = llmResponse.content;
      const text = content.contentType === 'text' ? String(content.value) : '';
      setMessages((prev) => [...prev, { sender: 'agent', text }]);

      if (session) {
        await session.appendMessage({
          role: 'assistant',
          content: { contentType: 'text', value: text },
        });
        await session.commit();
        await refreshSessions();
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { sender: 'agent', text: 'Error executing task' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <ChatSidebar
        sessions={sessions}
        currentSessionId={activeTabId || session?.sessionId}
        onNew={startNewSession}
        onOpen={openSession}
      />
      <div style={{ flex: 1, padding: '8px' }}>
        <ChatTabs
          tabs={openTabIds.map((id) => ({
            id,
            title: sessions.find((s) => s.id === id)?.title || id,
          }))}
          activeTabId={activeTabId}
          onSelect={openSession}
        />
        <div style={{ marginBottom: '8px' }}>
          <label htmlFor="bridge">LLM Bridge: </label>
          <select
            id="bridge"
            value={bridgeId}
            onChange={async (e) => {
              const id = e.target.value;
              await manager.switchBridge(id);
              setBridgeId(id);
            }}
          >
            {manager.getBridgeIds().map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </div>
        <div
          style={{
            height: '400px',
            overflowY: 'auto',
            border: '1px solid #ccc',
            padding: '8px',
          }}
        >
          {messages.map((m, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <strong>{m.sender === 'user' ? 'You' : 'Agent'}:</strong> {m.text}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Type a message"
            style={{ width: '80%' }}
            disabled={busy}
          />
          <button onClick={handleSend} disabled={busy}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatApp;
