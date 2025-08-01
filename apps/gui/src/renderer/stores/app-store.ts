import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import type { LlmBridgeConfig, Preset, McpConfig } from '../types/core-types';

// UI 상태 인터페이스
interface UIState {
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  activeView: 'chat' | 'settings' | 'history' | 'mcp-list';
  commandPaletteOpen: boolean;
}

// 채팅 상태 인터페이스 (클라이언트 상태만)
interface ChatState {
  activeSessionId: string | null;
  openTabIds: string[];
  searchTerm: string;
  busy: boolean;
}

// 설정 상태 인터페이스
interface SettingsState {
  currentBridge: { id: string; config: LlmBridgeConfig } | null;
  bridgeIds: string[];
  selectedPresetId: string;
  showMcpSettings: boolean;
  showMcpList: boolean;
}

// 전체 앱 상태
interface AppState {
  ui: UIState;
  chat: ChatState;
  settings: SettingsState;
}

// 액션 인터페이스
interface AppActions {
  // UI 액션
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setActiveView: (view: UIState['activeView']) => void;
  toggleCommandPalette: () => void;

  // 채팅 액션
  setActiveSession: (sessionId: string | null) => void;
  addTab: (sessionId: string) => void;
  removeTab: (sessionId: string) => void;
  setSearchTerm: (term: string) => void;
  setBusy: (busy: boolean) => void;

  // 설정 액션
  setCurrentBridge: (bridge: { id: string; config: LlmBridgeConfig } | null) => void;
  setBridgeIds: (ids: string[]) => void;
  setSelectedPreset: (presetId: string) => void;
  toggleMcpSettings: () => void;
  toggleMcpList: () => void;
}

// 초기 상태
const initialState: AppState = {
  ui: {
    leftSidebarOpen: true,
    rightSidebarOpen: false, // 기본적으로 우측 사이드바는 숨김
    activeView: 'chat',
    commandPaletteOpen: false,
  },
  chat: {
    activeSessionId: null,
    openTabIds: [],
    searchTerm: '',
    busy: false,
  },
  settings: {
    currentBridge: null,
    bridgeIds: [],
    selectedPresetId: '',
    showMcpSettings: false,
    showMcpList: false,
  },
};

// Zustand 스토어 생성
export const useAppStore = create<AppState & AppActions>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 상태
      ...initialState,

      // UI 액션
      toggleLeftSidebar: () =>
        set(
          (state) => ({
            ui: { ...state.ui, leftSidebarOpen: !state.ui.leftSidebarOpen },
          }),
          false,
          'toggleLeftSidebar'
        ),

      toggleRightSidebar: () =>
        set(
          (state) => ({
            ui: { ...state.ui, rightSidebarOpen: !state.ui.rightSidebarOpen },
          }),
          false,
          'toggleRightSidebar'
        ),

      setActiveView: (view) =>
        set(
          (state) => ({
            ui: { ...state.ui, activeView: view },
            // 설정 뷰 변경 시 관련 플래그 업데이트
            settings: {
              ...state.settings,
              showMcpSettings: view === 'settings',
              showMcpList: view === 'mcp-list',
            },
          }),
          false,
          'setActiveView'
        ),

      toggleCommandPalette: () =>
        set(
          (state) => ({
            ui: { ...state.ui, commandPaletteOpen: !state.ui.commandPaletteOpen },
          }),
          false,
          'toggleCommandPalette'
        ),

      // 채팅 액션
      setActiveSession: (sessionId) =>
        set(
          (state) => ({
            chat: { ...state.chat, activeSessionId: sessionId },
          }),
          false,
          'setActiveSession'
        ),

      addTab: (sessionId) =>
        set(
          (state) => ({
            chat: {
              ...state.chat,
              openTabIds: state.chat.openTabIds.includes(sessionId)
                ? state.chat.openTabIds
                : [...state.chat.openTabIds, sessionId],
              activeSessionId: sessionId,
            },
          }),
          false,
          'addTab'
        ),

      removeTab: (sessionId) =>
        set(
          (state) => {
            const newOpenTabIds = state.chat.openTabIds.filter((id) => id !== sessionId);
            const newActiveSessionId =
              state.chat.activeSessionId === sessionId
                ? newOpenTabIds[newOpenTabIds.length - 1] || null
                : state.chat.activeSessionId;

            return {
              chat: {
                ...state.chat,
                openTabIds: newOpenTabIds,
                activeSessionId: newActiveSessionId,
              },
            };
          },
          false,
          'removeTab'
        ),

      setSearchTerm: (term) =>
        set(
          (state) => ({
            chat: { ...state.chat, searchTerm: term },
          }),
          false,
          'setSearchTerm'
        ),

      setBusy: (busy) =>
        set(
          (state) => ({
            chat: { ...state.chat, busy },
          }),
          false,
          'setBusy'
        ),

      // 설정 액션
      setCurrentBridge: (bridge) =>
        set(
          (state) => ({
            settings: { ...state.settings, currentBridge: bridge },
          }),
          false,
          'setCurrentBridge'
        ),

      setBridgeIds: (ids) =>
        set(
          (state) => ({
            settings: { ...state.settings, bridgeIds: ids },
          }),
          false,
          'setBridgeIds'
        ),

      setSelectedPreset: (presetId) =>
        set(
          (state) => ({
            settings: { ...state.settings, selectedPresetId: presetId },
          }),
          false,
          'setSelectedPreset'
        ),

      toggleMcpSettings: () =>
        set(
          (state) => ({
            settings: { ...state.settings, showMcpSettings: !state.settings.showMcpSettings },
          }),
          false,
          'toggleMcpSettings'
        ),

      toggleMcpList: () =>
        set(
          (state) => ({
            settings: { ...state.settings, showMcpList: !state.settings.showMcpList },
          }),
          false,
          'toggleMcpList'
        ),
    })),
    {
      name: 'agentos-app-store', // DevTools에서 표시될 이름
    }
  )
);

// 선택적 구독을 위한 커스텀 훅들
export const useUIState = () => useAppStore((state) => state.ui);
export const useChatState = () => useAppStore((state) => state.chat);
export const useSettingsState = () => useAppStore((state) => state.settings);

// 특정 액션만 필요한 경우를 위한 훅들
export const useUIActions = () =>
  useAppStore((state) => ({
    toggleLeftSidebar: state.toggleLeftSidebar,
    toggleRightSidebar: state.toggleRightSidebar,
    setActiveView: state.setActiveView,
    toggleCommandPalette: state.toggleCommandPalette,
  }));

export const useChatActions = () =>
  useAppStore((state) => ({
    setActiveSession: state.setActiveSession,
    addTab: state.addTab,
    removeTab: state.removeTab,
    setSearchTerm: state.setSearchTerm,
    setBusy: state.setBusy,
  }));

export const useSettingsActions = () =>
  useAppStore((state) => ({
    setCurrentBridge: state.setCurrentBridge,
    setBridgeIds: state.setBridgeIds,
    setSelectedPreset: state.setSelectedPreset,
    toggleMcpSettings: state.toggleMcpSettings,
    toggleMcpList: state.toggleMcpList,
  }));
