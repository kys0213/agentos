import { Archive, Bot, MessageSquare, MoreVertical, Pin, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ChatSessionMetadata } from '@agentos/core';
import MessageRenderer from './MessageRenderer';

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  selectedChatId?: string;
}

export function ChatHistory({ onSelectChat, selectedChatId }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatSessions, setChatSessions] = useState<ChatSessionMetadata[]>([]);

  // TODO: get chat sessions from backend
  useEffect(() => {
    // TODO: get chat sessions from backend
    setChatSessions([]);
  }, []);

  // Group chats by date
  const groupChatsByDate = (sessions: ChatSessionMetadata[]) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      today: sessions.filter(
        (session) => session.updatedAt.toDateString() === today.toDateString()
      ),
      yesterday: sessions.filter(
        (session) => session.updatedAt.toDateString() === yesterday.toDateString()
      ),
      thisWeek: sessions.filter(
        (session) =>
          session.updatedAt > lastWeek &&
          session.updatedAt.toDateString() !== today.toDateString() &&
          session.updatedAt.toDateString() !== yesterday.toDateString()
      ),
      older: sessions.filter((session) => session.updatedAt <= lastWeek),
    };

    return groups;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const groupedChats = groupChatsByDate(chatSessions);

  const ChatItem = ({ session }: { session: ChatSessionMetadata }) => (
    <div
      key={session.sessionId}
      className={`p-3 rounded-lg cursor-pointer transition-colors group ${
        selectedChatId === session.sessionId
          ? 'bg-blue-50 border border-blue-200'
          : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelectChat(session.sessionId)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h4 className="text-sm font-medium truncate">{session.title}</h4>
        </div>
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
          <MoreVertical className="w-3 h-3" />
        </Button>
      </div>

      {session.recentMessages.length > 0 && (
        <MessageRenderer message={session.recentMessages[0]} mode="compact" />
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Bot className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{session.joinedAgents[0].name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {session.totalMessages}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTime(session.updatedAt)}</span>
        </div>
      </div>
    </div>
  );

  const renderChatGroup = (title: string, chats: ChatSessionMetadata[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h5 className="text-xs font-medium text-muted-foreground mb-2 px-2">{title}</h5>
        <div className="space-y-1">
          {chats.map((chat) => (
            <ChatItem key={chat.sessionId} session={chat} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-80 border-r bg-white flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderChatGroup('Today', groupedChats.today)}
        {renderChatGroup('Yesterday', groupedChats.yesterday)}
        {renderChatGroup('This Week', groupedChats.thisWeek)}
        {renderChatGroup('Older', groupedChats.older)}

        {/* Empty State */}
        {Object.values(groupedChats).every((group) => group.length === 0) && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button variant="outline" size="sm">
                Start your first chat
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
