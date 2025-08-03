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
import { ChatSession } from '../../types/chat-types';
import { getChatSessions } from '../../services/mock';

interface ChatHistoryProps {
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: () => void;
  selectedChatId?: string;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectChat, onNewChat, selectedChatId }) => {
  const chatSessions = getChatSessions();

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
          <div className="flex items-center gap-2 mt-2 mb-2">
            <Pin className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pinned
            </span>
          </div>
        )}
        {isFirstInRecent && (
          <div className="flex items-center gap-2 mt-4 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Recent
            </span>
          </div>
        )}
        <div
          key={chat.id}
          className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
            selectedChatId === chat.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectChat(chat)}
        >
          <div className="flex items-start gap-3">
            <div
              className={`w-8 h-8 ${getAgentColor(chat.agentName)} rounded-full flex items-center justify-center flex-shrink-0`}
            >
              <span className="text-xs text-white font-medium">
                {chat.agentName
                  .split(' ')
                  .map((word) => word[0])
                  .join('')}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm truncate">{chat.title}</h4>
                <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                  {formatTimestamp(chat.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">{chat.lastMessage}</p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {chat.agentName}
                </Badge>
                <span className="text-xs text-gray-500">{chat.messageCount} messages</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 bg-muted flex flex-col h-full">
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

      <div className="flex-1">
        <AutoSizer>
          {({ height, width }) => (
            <List height={height} itemCount={items.length} itemSize={125} width={width}>
              {Row}
            </List>
          )}
        </AutoSizer>
      </div>

      {archived.length > 0 && (
        <div className="p-3 border-t bg-background">
          <div className="flex items-center gap-2 mb-2">
            <Archive className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Archived ({archived.length})
            </span>
          </div>
        </div>
      )}

      <div className="border-t bg-background p-3">
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Access</h4>
          <div className="grid grid-cols-2 gap-1">
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Home className="w-3 h-3" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Layers className="w-3 h-3" />
              Presets
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Bot className="w-3 h-3" />
              Agents
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Cpu className="w-3 h-3" />
              Models
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Wrench className="w-3 h-3" />
              Tools
            </Button>
            <Button variant="ghost" size="sm" className="h-8 text-xs justify-start gap-2 px-2">
              <Network className="w-3 h-3" />
              RACP
            </Button>
          </div>
          <Button variant="outline" size="sm" className="w-full h-8 text-xs gap-2">
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
