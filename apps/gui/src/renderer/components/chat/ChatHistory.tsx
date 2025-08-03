import React from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Plus,
  Search,
  Pin,
  Archive,
  Home,
  Layers,
  Bot,
  Cpu,
  Wrench,
  Network,
  Settings,
} from 'lucide-react';
import { AppModeState, ChatSession } from '../../types/chat-types';
import { getChatSessions } from '../../services/mock';

interface ChatHistoryProps {
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: () => void;
  selectedChatId?: string;
  onNavigate: (section: AppModeState['activeSection']) => void;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  onSelectChat,
  onNewChat,
  selectedChatId,
  onNavigate,
}) => {
  const chatSessions = getChatSessions();

  const quickNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'presets', label: 'Presets', icon: Layers },
    { id: 'subagents', label: 'Agents', icon: Bot },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'racp', label: 'RACP', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const pinned = chatSessions.filter((c) => c.isPinned);
  const recent = chatSessions.filter((c) => !c.isPinned && !c.isArchived);
  const archived = chatSessions.filter((c) => c.isArchived);

  const items = [...pinned, ...recent];

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const chat = items[index];
    const isPinnedSection = index < pinned.length;
    const isFirstInPinned = isPinnedSection && index === 0;
    const isFirstInRecent = index === pinned.length;

    return (
      <div style={style} className="px-3">
        {isFirstInPinned && (
          <div className="flex items-center gap-2 mt-3 mb-3 px-1">
            <Pin className="w-4 h-4 text-gray-600 fill-current" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              📌 Pinned
            </span>
          </div>
        )}
        {isFirstInRecent && (
          <div className="flex items-center gap-2 mt-5 mb-3 px-1">
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
              Older
            </span>
          </div>
        )}
        <div
          key={chat.id}
          className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-200 mb-3 mx-1 ${
            selectedChatId === chat.id
              ? 'bg-blue-50 border border-blue-200 shadow-sm'
              : 'hover:bg-gray-50 hover:shadow-sm'
          }`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 ${getAgentColor(chat.agentName)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <span className="text-sm text-white font-semibold">
                {chat.agentName
                  .split(' ')
                  .map((word) => word[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm truncate text-gray-900">{chat.title}</h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-3">
                  {formatTimestamp(chat.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                {chat.lastMessage}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-medium">
                  {chat.agentName}
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {chat.messageCount} messages
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-muted flex flex-col h-full border-r">
      {/* 고정 헤더 */}
      <div className="p-4 border-b bg-background">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Chats</h2>
          <Button variant="outline" size="sm" onClick={onNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 스크롤 가능한 채팅 목록 */}
      <div className="flex-1 overflow-y-auto">
        <AutoSizer>
          {({ height, width }) => (
            <List height={height} itemCount={items.length} itemSize={140} width={width}>
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

      {/* 고정 푸터 */}
      <div className="border-t bg-background p-3">
        {archived.length > 0 && (
          <div className="pb-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Archived ({archived.length})
              </span>
            </div>
          </div>
        )}
        {/* Quick Navigation */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Access</h4>
          <div className="grid grid-cols-2 gap-1">
            {quickNavItems.slice(0, 6).map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => onNavigate(item.id as AppModeState['activeSection'])}
                  className="h-8 text-xs justify-start gap-2 px-2"
                >
                  <Icon className="w-3 h-3" />
                  {item.label}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('settings')}
            className="w-full h-8 text-xs gap-2"
          >
            <Settings className="w-3 h-3" />
            Settings
          </Button>
        </div>
      </div>
    </div>
  );
};

const formatTimestamp = (timestamp: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - timestamp.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) return 'now';
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return timestamp.toLocaleDateString();
};

const getAgentColor = (agentName: string) => {
  const colors: { [key: string]: string } = {
    'Data Analyzer': 'bg-blue-500',
    'Code Assistant': 'bg-green-500',
    'Content Writer': 'bg-purple-500',
    'Research Assistant': 'bg-orange-500',
  };
  return colors[agentName] || 'bg-gray-500';
};

export default ChatHistory;
