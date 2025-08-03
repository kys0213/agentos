import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Plus, Search, Pin, Archive } from 'lucide-react';
import { ChatSession } from '../../types/chat-types';
import { getChatSessions } from '../../services/mock';

interface ChatHistoryProps {
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: () => void;
  selectedChatId?: string;
}

/**
 * 채팅 히스토리 사이드바
 */
const ChatHistory: React.FC<ChatHistoryProps> = ({ onSelectChat, onNewChat, selectedChatId }) => {
  const chatSessions = getChatSessions();

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'now';
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else if (diffDays < 7) {
      return `${diffDays}d`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  const getAgentColor = (agentName: string) => {
    const colors = {
      'Data Analyzer': 'bg-blue-500',
      'Code Assistant': 'bg-green-500',
      'Content Writer': 'bg-purple-500',
      'Research Assistant': 'bg-orange-500',
    };
    return colors[agentName as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="w-80 bg-muted border-r flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Chats</h2>
          <Button variant="outline" size="sm" onClick={onNewChat}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Section */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Pin className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Pinned
            </span>
          </div>

          {chatSessions
            .filter((chat) => chat.isPinned)
            .map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedChatId === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
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
            ))}
        </div>

        {/* Recent Section */}
        <div className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Recent
            </span>
          </div>

          {chatSessions
            .filter((chat) => !chat.isPinned && !chat.isArchived)
            .map((chat) => (
              <div
                key={chat.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-2 ${
                  selectedChatId === chat.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50'
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
            ))}
        </div>

        {/* Archived Section */}
        {chatSessions.some((chat) => chat.isArchived) && (
          <div className="p-3 border-t">
            <div className="flex items-center gap-2 mb-2">
              <Archive className="w-3 h-3 text-gray-500" />
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Archived ({chatSessions.filter((chat) => chat.isArchived).length})
              </span>
            </div>

            {chatSessions
              .filter((chat) => chat.isArchived)
              .slice(0, 3) // Show only first 3 archived
              .map((chat) => (
                <div
                  key={chat.id}
                  className="p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors mb-1"
                  onClick={() => onSelectChat(chat)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 ${getAgentColor(chat.agentName)} rounded-full flex items-center justify-center flex-shrink-0`}
                    >
                      <span className="text-xs text-white font-medium">
                        {chat.agentName
                          .split(' ')
                          .map((word) => word[0])
                          .join('')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs truncate">{chat.title}</h4>
                      <span className="text-xs text-gray-500">
                        {formatTimestamp(chat.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
  );
};

export default ChatHistory;
