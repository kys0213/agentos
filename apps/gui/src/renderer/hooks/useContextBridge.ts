import { useState, useCallback } from 'react';
import { useUIActions, useChatState, useUIState } from '../stores/app-store';

/**
 * Context Bridge 패턴 - 화면 간 자연스러운 전환과 컨텍스트 보존
 *
 * 핵심 기능:
 * - 화면 전환 시 현재 상태 저장
 * - 설정 → 채팅 복귀 시 이전 상태 복원
 * - 에러 상황에서 자동 설정 링크 제공
 */

interface NavigationContext {
  fromView: 'chat' | 'settings' | 'history' | 'mcp-list';
  chatSessionId?: string | null;
  settingsSection?: string;
  timestamp?: number;
  returnData?: Record<string, any>;
}

interface ContextBridgeReturn {
  goToSettings: (section?: string, fromContext?: Partial<NavigationContext>) => void;
  backToChat: (returnData?: Record<string, any>) => void;
  goToHistory: () => void;
  context: NavigationContext | null;
  hasContext: boolean;
}

export const useContextBridge = (): ContextBridgeReturn => {
  const { setActiveView } = useUIActions();
  const { activeSessionId } = useChatState();
  const { activeView } = useUIState();
  const [context, setContext] = useState<NavigationContext | null>(null);

  const goToSettings = useCallback(
    (section?: string, fromContext?: Partial<NavigationContext>) => {
      // 현재 컨텍스트 저장
      const newContext: NavigationContext = {
        fromView: activeView === 'settings' ? 'chat' : activeView,
        chatSessionId: activeSessionId,
        settingsSection: section,
        timestamp: Date.now(),
        ...fromContext,
      };

      setContext(newContext);
      setActiveView('settings');

      // 특정 설정 섹션으로 바로 이동하는 로직은
      // SettingsPanel에서 context를 읽어서 처리
      console.log('Context Bridge: Going to settings', newContext);
    },
    [setActiveView, activeView, activeSessionId]
  );

  const backToChat = useCallback(
    (returnData?: Record<string, any>) => {
      if (context?.chatSessionId) {
        // 이전 채팅 세션 복원 로직은 필요시 추가
        console.log('Context Bridge: Restoring chat session', context.chatSessionId);
      }

      // 채팅 뷰로 이동
      setActiveView('chat');

      // 설정 변경 결과가 있다면 처리
      if (returnData) {
        showSettingsAppliedFeedback(returnData);
      }

      // 컨텍스트 클리어
      setContext(null);

      console.log('Context Bridge: Returned to chat', { returnData });
    },
    [context, setActiveView]
  );

  const goToHistory = useCallback(() => {
    const newContext: NavigationContext = {
      fromView: activeView === 'history' ? 'chat' : activeView,
      chatSessionId: activeSessionId,
      timestamp: Date.now(),
    };

    setContext(newContext);
    setActiveView('history');

    console.log('Context Bridge: Going to history', newContext);
  }, [setActiveView, activeView, activeSessionId]);

  return {
    goToSettings,
    backToChat,
    goToHistory,
    context,
    hasContext: context !== null,
  };
};

/**
 * 설정 변경 완료 후 피드백 표시
 */
const showSettingsAppliedFeedback = (data: Record<string, any>) => {
  if (data.bridgeChanged) {
    // TODO: Toast 라이브러리 추가 후 구현
    console.log(`✅ Switched to ${data.bridgeName}. Ready to chat!`);
  }

  if (data.mcpAdded) {
    console.log(`✅ MCP server "${data.mcpName}" connected successfully!`);
  }

  if (data.presetApplied) {
    console.log(`✅ Preset "${data.presetName}" applied successfully!`);
  }

  // 임시로 브라우저 알림 (나중에 toast로 교체)
  if (data.bridgeChanged || data.mcpAdded || data.presetApplied) {
    // 간단한 성공 표시
    const message = data.bridgeChanged
      ? `Switched to ${data.bridgeName}`
      : data.mcpAdded
        ? `MCP server "${data.mcpName}" connected`
        : `Preset "${data.presetName}" applied`;

    // 임시로 console.log (나중에 toast 시스템으로 교체)
    console.log('🔄 Settings Applied:', message);
  }
};

/**
 * 에러 컨텍스트에서 자동으로 설정 링크를 생성하는 헬퍼
 */
export const useErrorToSettingsLink = () => {
  const { goToSettings } = useContextBridge();

  const getErrorActions = useCallback(
    (errorContent: string) => {
      const actions: Array<{
        label: string;
        action: () => void;
        variant?: 'default' | 'destructive';
      }> = [];

      if (errorContent.includes('MCP') || errorContent.includes('mcp')) {
        actions.push({
          label: 'Fix MCP Settings',
          action: () => goToSettings('mcp'),
          variant: 'default',
        });
      }

      if (
        errorContent.includes('Bridge') ||
        errorContent.includes('LLM') ||
        errorContent.includes('llm')
      ) {
        actions.push({
          label: 'Check Bridge Settings',
          action: () => goToSettings('llm'),
          variant: 'default',
        });
      }

      if (
        errorContent.includes('API key') ||
        errorContent.includes('authentication') ||
        errorContent.includes('auth')
      ) {
        actions.push({
          label: 'Update API Keys',
          action: () => goToSettings('llm'),
          variant: 'destructive',
        });
      }

      if (errorContent.includes('preset') || errorContent.includes('Preset')) {
        actions.push({
          label: 'Manage Presets',
          action: () => goToSettings('presets'),
          variant: 'default',
        });
      }

      return actions;
    },
    [goToSettings]
  );

  return { getErrorActions };
};
