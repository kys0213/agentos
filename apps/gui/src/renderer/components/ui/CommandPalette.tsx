import React, { useMemo, useEffect } from 'react';
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  ActionId,
  ActionImpl
} from 'kbar';
import { useAppStore, useChatActions } from '../../stores/app-store';
import { useChatSessions } from '../../hooks/queries/use-chat-sessions';
import { useBridgeIds, useSwitchBridge } from '../../hooks/queries/use-bridge';
import { useContextBridge } from '../../hooks/useContextBridge';
import { Services } from '../../services';
import { 
  MessageSquarePlus, 
  Settings, 
  Bot, 
  Cpu, 
  Server,
  Palette,
  History,
  HelpCircle
} from 'lucide-react';

interface CommandAction {
  id: string;
  name: string;
  shortcut?: string[];
  keywords: string;
  section?: string;
  parent?: string;
  icon?: React.ReactNode;
  perform?: () => void | Promise<void>;
}

const CommandPalette: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setActiveView, toggleLeftSidebar, toggleRightSidebar } = useAppStore();
  const { setActiveSession, addTab } = useChatActions();
  const { data: bridgeIds = [] } = useBridgeIds();
  const { mutate: switchBridge } = useSwitchBridge();
  const { goToSettings } = useContextBridge();

  const startNewChat = async () => {
    try {
      const chatService = Services.getChat();
      const newSession = await chatService.createSession();
      setActiveSession(newSession.id);
      addTab(newSession.id);
      setActiveView('chat');
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const openMCPSettings = () => {
    goToSettings('mcp');
  };

  const getBridgeIcon = (bridgeId: string) => {
    switch (bridgeId.toLowerCase()) {
      case 'claude':
      case 'anthropic':
        return <Bot className="w-4 h-4" />;
      case 'openai':
      case 'gpt':
        return <Cpu className="w-4 h-4" />;
      case 'echo':
      case 'reverse':
        return <Server className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const actions: CommandAction[] = useMemo(() => [
    // Chat Actions
    {
      id: 'new-chat',
      name: 'New Chat',
      shortcut: ['c', 'n'],
      keywords: 'create conversation start fresh new chat message',
      perform: startNewChat,
      icon: <MessageSquarePlus className="w-4 h-4" />,
      section: 'Chat'
    },
    {
      id: 'chat-history',
      name: 'Chat History',
      shortcut: ['h'],
      keywords: 'history previous conversations past chats',
      perform: () => setActiveView('history'),
      icon: <History className="w-4 h-4" />,
      section: 'Chat'
    },

    // Navigation Actions
    {
      id: 'toggle-left-sidebar',
      name: 'Toggle Left Sidebar',
      shortcut: ['['],
      keywords: 'left sidebar navigation menu toggle',
      perform: () => toggleLeftSidebar(),
      section: 'Navigation'
    },
    {
      id: 'toggle-right-sidebar',
      name: 'Toggle Right Sidebar',
      shortcut: [']'],
      keywords: 'right sidebar history context toggle',
      perform: () => toggleRightSidebar(),
      section: 'Navigation'
    },

    // Settings Actions
    {
      id: 'settings',
      name: 'Open Settings',
      shortcut: ['s'],
      keywords: 'settings configuration preferences options',
      perform: () => goToSettings(),
      icon: <Settings className="w-4 h-4" />,
      section: 'Settings'
    },
    {
      id: 'switch-bridge',
      name: 'Switch LLM Bridge',
      shortcut: ['b'],
      keywords: 'llm bridge change model switch provider',
      icon: <Bot className="w-4 h-4" />,
      section: 'Settings'
    },
    {
      id: 'mcp-settings',
      name: 'MCP Settings',
      shortcut: ['m'],
      keywords: 'mcp server configure tools extensions',
      perform: openMCPSettings,
      icon: <Server className="w-4 h-4" />,
      section: 'Settings'
    },

    // 동적으로 생성되는 Bridge 액션들
    ...bridgeIds.map((bridgeId): CommandAction => ({
      id: `bridge-${bridgeId}`,
      name: `Switch to ${bridgeId.charAt(0).toUpperCase() + bridgeId.slice(1)}`,
      parent: 'switch-bridge',
      keywords: `${bridgeId} switch bridge ai assistant`,
      perform: () => switchBridge(bridgeId),
      icon: getBridgeIcon(bridgeId),
    })),

    // Theme Actions
    {
      id: 'theme',
      name: 'Change Theme',
      shortcut: ['t'],
      keywords: 'theme appearance dark light mode',
      icon: <Palette className="w-4 h-4" />,
      section: 'Appearance'
    },

    // Help Actions
    {
      id: 'help',
      name: 'Help & Documentation',
      shortcut: ['?'],
      keywords: 'help documentation guide tutorial support',
      perform: () => {
        // TODO: Open help modal or navigate to help
        console.log('Opening help...');
      },
      icon: <HelpCircle className="w-4 h-4" />,
      section: 'Help'
    }
  ], [setActiveView, toggleLeftSidebar, toggleRightSidebar, startNewChat, openMCPSettings, bridgeIds, switchBridge, goToSettings]);

  // 글로벌 키보드 단축키 등록 (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        // kbar가 자동으로 Command Palette를 토글합니다
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <KBarProvider 
      actions={actions}
      options={{
        enableHistory: true,
        disableScrollbarManagement: true,
        disableDocumentLock: false,
      }}
    >
      <KBarPortal>
        <KBarPositioner className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <KBarAnimator className="mx-auto mt-[10vh] max-w-lg overflow-hidden rounded-lg bg-white shadow-xl border">
            <KBarSearch 
              className="w-full border-0 border-b px-4 py-3 text-lg outline-none focus:ring-0 placeholder:text-gray-400"
              placeholder="Type a command or search..."
              defaultPlaceholder="Type a command or search..."
              aria-label="Command palette search"
              data-testid="command-search"
            />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </KBarProvider>
  );
};

const RenderResults: React.FC = () => {
  const { results, rootActionId } = useMatches();

  return (
    <KBarResults
      items={results}
      maxHeight={400}
      onRender={({ item, active }) => {
        if (typeof item === 'string') {
          // Section header
          return (
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50">
              {item}
            </div>
          );
        }

        const action = item as CommandAction;
        return (
          <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              active 
                ? 'bg-blue-50 text-blue-900' 
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            role="option"
            aria-selected={active}
            data-testid={`command-${action.id}`}
          >
            {action.icon && (
              <span className={`${active ? 'text-blue-600' : 'text-gray-400'}`}>
                {action.icon}
              </span>
            )}
            <div className="flex-1">
              <div className="font-medium">{action.name}</div>
            </div>
            {action.shortcut && action.shortcut.length > 0 && (
              <div className="flex gap-1">
                {action.shortcut.map((key, index) => (
                  <kbd
                    key={index}
                    className={`px-2 py-1 text-xs font-mono rounded border ${
                      active 
                        ? 'bg-blue-100 border-blue-200 text-blue-800' 
                        : 'bg-gray-100 border-gray-200 text-gray-600'
                    }`}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
};

export default CommandPalette;