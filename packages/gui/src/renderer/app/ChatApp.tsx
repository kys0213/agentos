import React from 'react';
import { BridgeManager } from '../utils/BridgeManager';
import EchoBridge from '../bridges/EchoBridge';
import ReverseBridge from '../bridges/ReverseBridge';
import { ChatManager, ChatSessionDescription, McpConfig } from '@agentos/core';
import { createChatManager } from '../utils/chat-manager';
import ChatSidebar from '../components/ChatSidebar';
import ChatTabs from '../components/ChatTabs';
import McpSettings from '../pages/McpSettings';
import McpList from '../pages/McpList';
import SettingsMenu from '../components/SettingsMenu';
import { McpConfigStore } from '../stores/mcp-config-store';
import { loadMcpFromStore } from '../utils/mcp-loader';
import PresetSelector from '../components/PresetSelector';
import { Preset } from '@agentos/core';
import { loadPresets, PresetStore } from '../stores/preset-store';
import { LlmBridgeStore } from '../stores/llm-bridge-store';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';
import useChatSession from '../hooks/useChatSession';

const manager = new BridgeManager();
manager.register('echo', new EchoBridge());
manager.register('reverse', new ReverseBridge());

const chatManager: ChatManager = createChatManager();
const mcpConfigStore = new McpConfigStore();
const presetStore = new PresetStore();
const bridgeStore = new LlmBridgeStore();

for (const b of bridgeStore.list()) {
  const BridgeCtor = b.type === 'echo' ? EchoBridge : ReverseBridge;
  manager.register(b.id, new BridgeCtor());
}

const ChatApp: React.FC = () => {
  const [busy, setBusy] = React.useState(false);
  const [bridgesVersion, setBridgesVersion] = React.useState(0);
  const [bridgeId, setBridgeId] = React.useState(manager.getCurrentId()!);
  const [sessions, setSessions] = React.useState<ChatSessionDescription[]>([]);
  const [openTabIds, setOpenTabIds] = React.useState<string[]>([]);
  const [activeTabId, setActiveTabId] = React.useState<string>('');
  const [showSettings, setShowSettings] = React.useState(false);
  const [showMcpList, setShowMcpList] = React.useState(false);
  const [presets, setPresets] = React.useState<Preset[]>([]);
  const [presetId, setPresetId] = React.useState<string>('');
  const bridgeIds = React.useMemo(() => manager.getBridgeIds(), [bridgesVersion]);
  const { session, messages, openSession, startNewSession, send } = useChatSession(
    chatManager,
    manager
  );

  React.useEffect(() => {
    const loaded = loadMcpFromStore(mcpConfigStore);
    if (loaded) {
      // MCP loaded but not used
    }
  }, []);

  React.useEffect(() => {
    loadPresets(presetStore).then((list) => {
      setPresets(list);
    });
  }, []);

  const handleSaveMcp = (config: McpConfig) => {
    mcpConfigStore.set(config);
    setShowSettings(false);
  };

  const refreshSessions = React.useCallback(async () => {
    const { items } = await chatManager.list();
    setSessions(items);
  }, []);

  const handleOpenSession = React.useCallback(
    async (id: string) => {
      const loaded = await openSession(id);
      setPresetId(loaded.preset?.id ?? '');
      setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActiveTabId(id);
    },
    [openSession]
  );

  const handleStartNewSession = React.useCallback(async () => {
    const preset = presets.find((p) => p.id === presetId);
    const newS = await startNewSession(preset);
    setOpenTabIds((prev) => [...prev, newS.sessionId]);
    setActiveTabId(newS.sessionId);
    await refreshSessions();
  }, [startNewSession, refreshSessions, presets, presetId]);

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
    if (presets.length > 0 && !session) {
      void handleStartNewSession();
    }
  }, [handleStartNewSession, presets, session]);

  const handleSend = async (text: string) => {
    try {
      setBusy(true);
      await send(text);
      await refreshSessions();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <ChatSidebar
        sessions={sessions}
        currentSessionId={activeTabId || session?.sessionId}
        onNew={handleStartNewSession}
        onOpen={handleOpenSession}
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
        <SettingsMenu
          bridgeStore={bridgeStore}
          manager={manager}
          onBridgesChange={() => setBridgesVersion((v) => v + 1)}
        />
        <ChatTabs
          tabs={openTabIds.map((id) => ({
            id,
            title: sessions.find((s) => s.id === id)?.title || id,
          }))}
          activeTabId={activeTabId}
          onSelect={handleOpenSession}
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
            {bridgeIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
          <PresetSelector presets={presets} value={presetId} onChange={handleChangePreset} />
        </div>
        <ChatMessageList messages={messages} />
        <ChatInput onSend={handleSend} disabled={busy} />
      </div>
    </div>
  );
};

export default ChatApp;
