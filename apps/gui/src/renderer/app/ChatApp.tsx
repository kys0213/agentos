import React from 'react';
import { Box, Button, Flex, Select, FormControl, FormLabel, Input } from '@chakra-ui/react';
import { BridgeManager } from '../utils/BridgeManager';
import EchoBridge from '../bridges/EchoBridge';
import ReverseBridge from '../bridges/ReverseBridge';
import { chatService } from '../services/chat-service';
import ChatSidebar from '../components/ChatSidebar';
import ChatTabs from '../components/ChatTabs';
import McpSettings from '../pages/McpSettings';
import McpList from '../pages/McpList';
import SettingsMenu from '../components/SettingsMenu';
import { McpConfigStore } from '../stores/mcp-config-store';
import { loadMcpFromStore } from '../utils/mcp-loader';
import PresetSelector from '../components/PresetSelector';
import type { ChatSessionDescription, Preset, McpConfig } from '../types/core-types';
import { loadPresets, PresetStore } from '../stores/preset-store';
import { LlmBridgeStore } from '../stores/llm-bridge-store';
import ChatMessageList from '../components/ChatMessageList';
import ChatInput from '../components/ChatInput';
import useChatSession from '../hooks/useChatSession';
import useMessageSearch from '../hooks/useMessageSearch';

const manager = new BridgeManager();
manager.register('echo', new EchoBridge());
manager.register('reverse', new ReverseBridge());

// IPC 기반 채팅 서비스 사용
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
  const [searchTerm, setSearchTerm] = React.useState('');
  const bridgeIds = React.useMemo(() => manager.getBridgeIds(), [bridgesVersion]);
  const { sessionId, messages, openSession, startNewSession, send } = useChatSession(manager);
  const filteredMessages = useMessageSearch(messages, searchTerm);

  React.useEffect(() => {
    const loadMcp = async () => {
      const loaded = await loadMcpFromStore(mcpConfigStore);
      if (loaded) {
        // MCP loaded but not used
      }
    };
    void loadMcp();
  }, []);

  React.useEffect(() => {
    loadPresets(presetStore).then((list) => {
      setPresets(list);
    });
  }, []);

  const handleSaveMcp = async (config: McpConfig) => {
    await mcpConfigStore.set(config);
    setShowSettings(false);
  };

  const refreshSessions = React.useCallback(async () => {
    const { items } = await chatService.listSessions();
    setSessions(items);
  }, []);

  const handleOpenSession = React.useCallback(
    async (id: string) => {
      await openSession(id);
      // TODO: 프리셋 정보는 별도 IPC 호출로 가져와야 함
      setPresetId('');
      setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setActiveTabId(id);
    },
    [openSession]
  );

  const handleStartNewSession = React.useCallback(async () => {
    const preset = presets.find((p) => p.id === presetId);
    await startNewSession(preset);
    // 새 세션 ID는 Hook 내부에서 관리되므로 sessionId 사용
    if (sessionId) {
      setOpenTabIds((prev) => [...prev, sessionId]);
      setActiveTabId(sessionId);
    }
    await refreshSessions();
  }, [startNewSession, refreshSessions, presets, presetId, sessionId]);

  const handleChangePreset = async (id: string) => {
    setPresetId(id);
    const preset = presets.find((p) => p.id === id);
    if (sessionId) {
      // TODO: IPC를 통해 세션 프리셋 업데이트 API 추가 필요
      // await chatService.updateSessionPreset(sessionId, preset);
      await refreshSessions();
    }
  };

  React.useEffect(() => {
    if (presets.length > 0 && !sessionId) {
      void handleStartNewSession();
    }
  }, [handleStartNewSession, presets, sessionId]);

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
    <Flex h="100%" direction={{ base: 'column', md: 'row' }}>
      <ChatSidebar
        sessions={sessions}
        currentSessionId={activeTabId || sessionId || undefined}
        onNew={handleStartNewSession}
        onOpen={handleOpenSession}
        onShowMcps={() => setShowMcpList(true)}
      />
      <Box flex="1" p={2} display="flex" flexDirection="column">
        {showMcpList && (
          <McpList
            mcps={
              mcpConfigStore.getSyncCached() ? [mcpConfigStore.getSyncCached() as McpConfig] : []
            }
            onClose={() => setShowMcpList(false)}
          />
        )}
        <Button onClick={() => setShowSettings(true)} mb={2} size="sm">
          MCP Settings
        </Button>
        {showSettings && (
          <McpSettings initial={mcpConfigStore.getSyncCached()} onSave={handleSaveMcp} />
        )}
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
        <FormControl display="flex" alignItems="center" gap={2} mb={2} w="auto">
          <FormLabel htmlFor="bridge" mb="0">
            LLM Bridge:
          </FormLabel>
          <Select
            id="bridge"
            value={bridgeId}
            onChange={async (e) => {
              const id = e.target.value;
              await manager.switchBridge(id);
              setBridgeId(id);
            }}
            w="auto"
            size="sm"
          >
            {bridgeIds.map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </Select>
        </FormControl>
        <PresetSelector presets={presets} value={presetId} onChange={handleChangePreset} />
        <Input
          placeholder="Search messages"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          mb={2}
          size="sm"
        />
        <ChatMessageList messages={filteredMessages} loading={busy} />
        <ChatInput onSend={handleSend} disabled={busy} />
      </Box>
    </Flex>
  );
};

export default ChatApp;
