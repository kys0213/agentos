import { AgentMetadata, ChatSessionMetadata } from '@agentos/core';
import MessageRenderer from './MessageRenderer';
import {
  Archive,
  Bot,
  Cpu,
  Home,
  Layers,
  Network,
  Plus,
  Search,
  Settings,
  Wrench,
} from 'lucide-react';
import React from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList as List } from 'react-window';
import { getChatSessions } from '../../services/mock';
import { AppModeState } from '../../types/chat-types';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

interface ChatHistoryProps {
  onSelectChat: (chat: ChatSessionMetadata) => void;
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

  const items = chatSessions;

  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const chat = items[index];

    const presentAgent = chat.joinedAgents[0] || {
      id: 'main-orchestrator',
      name: 'Main Orchestrator',
      description: 'Main Orchestrator',
      icon: '🔍',
      keywords: ['main', 'orchestrator'],
    };

    return (
      <div style={style} className="px-3">
        <div
          key={chat.sessionId}
          className={`px-4 py-4 rounded-lg cursor-pointer transition-all duration-200 mb-3 mx-1 ${
            selectedChatId === chat.sessionId
              ? 'bg-blue-50 border border-blue-200 shadow-sm'
              : 'hover:bg-gray-50 hover:shadow-sm'
          }`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-9 h-9 ${getAgentColor(chat.joinedAgents)} rounded-full flex items-center justify-center flex-shrink-0 shadow-sm`}
            >
              <span className="text-sm text-white font-semibold">
                {presentAgent.name
                  .split(' ')
                  .map((word) => word[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm truncate text-gray-900">{chat.title}</h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-3">
                  {formatTimestamp(chat.createdAt)}
                </span>
              </div>
              <MessageRenderer
                message={chat.recentMessages[0]}
                mode="preview"
                showTimestamp={false}
                showAgentBadge={false}
                className="mb-3"
              />
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs font-medium">
                  {presentAgent.name}
                </Badge>
                <span className="text-xs text-gray-500 font-medium">
                  {chat.totalMessages} messages
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-muted flex flex-col h-full border-r border-gray-100">
      {/* 고정 헤더 */}
      <div className="px-4 py-4 border-b bg-background">
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
      <div className="border-t bg-background px-4 py-3">
        {chatSessions.length > 0 && (
          <div className="pb-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Archived ({chatSessions.length})
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

const getAgentColors = (agentMetadata: AgentMetadata[]) => {
  const colors: { [key: string]: string } = {
    'Data Analyzer': 'bg-blue-500',
    'Code Assistant': 'bg-green-500',
    'Content Writer': 'bg-purple-500',
    'Research Assistant': 'bg-orange-500',
  };
  return agentMetadata.map((agent) => colors[agent.id] || 'bg-gray-500');
};

const getAgentColor = (agentMetadata: AgentMetadata[]) => {
  const colors = getAgentColors(agentMetadata);
  return colors[0];
};

export default ChatHistory;
