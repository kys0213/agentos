import React from 'react';
import { VStack, Button } from '@chakra-ui/react';
import { useChatSessions } from '../../hooks/queries/use-chat-sessions';
import { usePresets } from '../../hooks/queries/use-presets';
import {
  useChatState,
  useChatActions,
  useSettingsState,
  useSettingsActions,
  useUIActions,
} from '../../stores/app-store';
import ChatSidebar from '../ChatSidebar';
import useChatSession from '../../hooks/useChatSession';
import { Services } from '../../bootstrap';

/**
 * 좌측 사이드바 컴포넌트
 * - 기존 ChatSidebar를 래핑하면서 현대화된 상태 관리 적용
 * - 세션 관리 및 네비게이션 담당
 */
const LeftSidebar: React.FC = () => {
  const chatState = useChatState();
  const settingsState = useSettingsState();
  const chatActions = useChatActions();
  const settingsActions = useSettingsActions();
  const uiActions = useUIActions();

  // React Query 데이터
  const { data: sessions = [], refetch: refetchSessions } = useChatSessions();
  const { data: presets = [] } = usePresets();

  // 기존 훅 (점진적 마이그레이션)
  const { sessionId, openSession, startNewSession } = useChatSession(Services.getChat());

  // 세션 열기 핸들러
  const handleOpenSession = React.useCallback(
    async (id: string) => {
      await openSession(id);
      chatActions.addTab(id);
    },
    [openSession, chatActions]
  );

  // 새 세션 생성 핸들러
  const handleStartNewSession = React.useCallback(async () => {
    const preset = presets.find((p) => p.id === settingsState.selectedPresetId);

    try {
      await startNewSession(preset);
      if (sessionId) {
        chatActions.addTab(sessionId);
      }
      refetchSessions();
    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  }, [
    startNewSession,
    presets,
    settingsState.selectedPresetId,
    sessionId,
    chatActions,
    refetchSessions,
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* 메인 채팅 사이드바 */}
      <div className="flex-1 overflow-hidden">
        <ChatSidebar
          sessions={sessions}
          currentSessionId={chatState.activeSessionId || sessionId || undefined}
          onNew={handleStartNewSession}
          onOpen={handleOpenSession}
          onShowMcps={() => settingsActions.toggleMcpList()}
        />
      </div>

      {/* 설정 버튼 */}
      <div className="border-t border-gray-200">
        <Button
          w="100%"
          borderRadius="none"
          onClick={() => uiActions.setActiveView('settings')}
          colorScheme="blue"
          variant="ghost"
          size="sm"
          className="transition-colors hover:bg-blue-50"
        >
          ⚙️ Settings
        </Button>
      </div>
    </div>
  );
};

export default LeftSidebar;
