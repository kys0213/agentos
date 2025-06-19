import React from 'react';
import { BridgeManager } from './BridgeManager';
import EchoBridge from './bridges/EchoBridge';
import ReverseBridge from './bridges/ReverseBridge';
import {
  ChatManager,
  ChatSession,
  ChatSessionDescription,
  MessageHistory,
  Mcp,
  McpConfig,
} from '@agentos/core';
import { createChatManager } from './chat-manager';
import ChatSidebar from './ChatSidebar';
import ChatTabs from './ChatTabs';
import McpSettings from './McpSettings';
import McpList from './McpList';
import SettingsMenu from './SettingsMenu';
import { McpConfigStore } from './mcp-config-store';
import { loadMcpFromStore } from './mcp-loader';
import PresetSelector from './PresetSelector';
import { Preset, loadPresets, PresetStore } from './preset-store';

interface Message {
  sender: 'user' | 'agent';
  text: string;
}

const manager = new BridgeManager();
manager.register('echo', new EchoBridge());
manager.register('reverse', new ReverseBridge());

const chatManager: ChatManager = createChatManager();
const mcpConfigStore = new McpConfigStore();
const presetStore = new PresetStore();

const ChatApp: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [bridgeId, setBridgeId] = React.useState(manager.getCurrentId()!);
  const [sessions, setSessions] = React.useState<ChatSessionDescription[]>([]);
  const [session, setSession] = React.useState<ChatSession | null>(null);
  const [openTabIds, setOpenTabIds] = React.useState<string[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string>('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [showMcpList, setShowMcpList] = React.useState(false);
  const [mcp, setMcp] = React.useState<Mcp | undefined>(undefined);
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [presetId, setPresetId] = React.useState<string>('');
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loaded = loadMcpFromStore(mcpConfigStore);
    if (loaded) {
      setMcp(loaded);
    }
  }, []);

  React.useEffect(() => {
    loadPresets(presetStore).then((list) => {
      setPresets(list);
    });
  }, []);

  const handleSaveMcp = (config: McpConfig) => {
    mcpConfigStore.set(config);
    setMcp(Mcp.create(config));
    setShowSettings(false);
  };

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
      setPresetId(loaded.preset?.id ?? '');
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
    const preset = presets.find((p) => p.id === presetId);
    const newS = await chatManager.create({ preset });
    setSession(newS);
    setMessages([]);
    setOpenTabIds((prev) => [...prev, newS.sessionId]);
    setActiveTabId(newS.sessionId);
    await refreshSessions();
  }, [refreshSessions, presets, presetId]);

  const handleChangePreset = async (id: string) => {
    setPresetId(id);
    const preset = presets.find((p) => p.id === id);
    if (session) {
      session.preset = preset;
      await session.commit();
      await refreshSessions();
    }
  };

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  React.useEffect(() => {
    const init = async () => {
      const preset = presets.find((p) => p.id === presetId);
      const newSession = await chatManager.create({ preset });
      setSession(newSession);
      setOpenTabIds([newSession.sessionId]);
      setActiveTabId(newSession.sessionId);
      setPresetId(preset?.id ?? '');
      await refreshSessions();
    };
    void init();
    // run once after presets loaded
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSessions, presets]);

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
        onShowMcps={() => setShowMcpList(true)}
      />
      <div style={{ flex: 1, padding: '8px' }}>
        {showMcpList && (
          <McpList
            mcps={mcpConfigStore.get() ? [mcpConfigStore.get() as McpConfig] : []}
            onClose={() => setShowMcpList(false)}
          />
        )}
        <button onClick={() => setShowSettings(true)} style={{ marginBottom: '8px' }}>
          MCP Settings
        </button>
        {showSettings && <McpSettings initial={mcpConfigStore.get()} onSave={handleSaveMcp} />}
        <SettingsMenu />
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
          <PresetSelector
            presets={presets}
            value={presetId}
            onChange={handleChangePreset}
          />
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
