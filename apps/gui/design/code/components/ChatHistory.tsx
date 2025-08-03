import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Search,
  MessageSquare,
  MoreVertical,
  Plus,
  Edit3,
  Trash2,
  Pin,
  Archive,
  Clock,
  Bot,
} from 'lucide-react';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  agentName: string;
  agentPreset: string;
  messageCount: number;
  isPinned?: boolean;
  isArchived?: boolean;
}

interface ChatHistoryProps {
  onSelectChat: (chat: ChatSession) => void;
  onNewChat: () => void;
  selectedChatId?: string;
}

export function ChatHistory({ onSelectChat, onNewChat, selectedChatId }: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Mock chat history data
  const chatSessions: ChatSession[] = [
    {
      id: '1',
      title: '데이터 분석 요청',
      lastMessage: 'CSV 파일의 매출 트렌드 분석을 완료했습니다.',
      timestamp: new Date(2024, 11, 15, 14, 30),
      agentName: 'Data Analyzer',
      agentPreset: 'Data Analysis Expert',
      messageCount: 12,
      isPinned: true,
    },
    {
      id: '2',
      title: 'React 컴포넌트 리팩토링',
      lastMessage: '코드 구조를 개선하는 방법을 제안드렸습니다.',
      timestamp: new Date(2024, 11, 15, 11, 20),
      agentName: 'Code Assistant',
      agentPreset: 'Development Helper',
      messageCount: 8,
    },
    {
      id: '3',
      title: '블로그 포스트 작성',
      lastMessage: 'AI와 개발자 워크플로우에 대한 초안을 작성했습니다.',
      timestamp: new Date(2024, 11, 14, 16, 45),
      agentName: 'Content Writer',
      agentPreset: 'Writing Specialist',
      messageCount: 15,
    },
    {
      id: '4',
      title: 'API 설계 리뷰',
      lastMessage: 'RESTful API 설계 원칙에 따른 개선사항을 정리했습니다.',
      timestamp: new Date(2024, 11, 14, 9, 15),
      agentName: 'Code Assistant',
      agentPreset: 'Development Helper',
      messageCount: 6,
    },
    {
      id: '5',
      title: '사용자 경험 개선 방안',
      lastMessage: 'UX 개선을 위한 5가지 핵심 포인트를 제안했습니다.',
      timestamp: new Date(2024, 11, 13, 13, 30),
      agentName: 'Content Writer',
      agentPreset: 'Writing Specialist',
      messageCount: 20,
      isArchived: true,
    },
    {
      id: '6',
      title: 'Python 성능 최적화',
      lastMessage: '코드 프로파일링 결과를 바탕으로 최적화 방안을 제시했습니다.',
      timestamp: new Date(2024, 11, 12, 15, 45),
      agentName: 'Code Assistant',
      agentPreset: 'Development Helper',
      messageCount: 11,
      isArchived: true,
    },
  ];

  // Group chats by date
  const groupChatsByDate = (chats: ChatSession[]) => {
    const filtered = chats.filter((chat) => {
      if (!showArchived && chat.isArchived) return false;
      if (searchQuery && !chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
        return false;
      return true;
    });

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const groups = {
      pinned: filtered.filter((chat) => chat.isPinned && !chat.isArchived),
      today: filtered.filter(
        (chat) =>
          !chat.isPinned &&
          !chat.isArchived &&
          chat.timestamp.toDateString() === today.toDateString()
      ),
      yesterday: filtered.filter(
        (chat) =>
          !chat.isPinned &&
          !chat.isArchived &&
          chat.timestamp.toDateString() === yesterday.toDateString()
      ),
      thisWeek: filtered.filter(
        (chat) =>
          !chat.isPinned &&
          !chat.isArchived &&
          chat.timestamp > lastWeek &&
          chat.timestamp.toDateString() !== today.toDateString() &&
          chat.timestamp.toDateString() !== yesterday.toDateString()
      ),
      older: filtered.filter(
        (chat) => (chat) => !chat.isPinned && !chat.isArchived && chat.timestamp <= lastWeek
      ),
      archived: filtered.filter((chat) => chat.isArchived),
    };

    return groups;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupedChats = groupChatsByDate(chatSessions);

  const ChatItem = ({ chat }: { chat: ChatSession }) => (
    <div
      key={chat.id}
      className={`p-3 rounded-lg cursor-pointer transition-colors group ${
        selectedChatId === chat.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={() => onSelectChat(chat)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {chat.isPinned && <Pin className="w-3 h-3 text-blue-600 flex-shrink-0" />}
          <h4 className="text-sm font-medium truncate">{chat.title}</h4>
          {chat.isArchived && <Archive className="w-3 h-3 text-gray-400 flex-shrink-0" />}
        </div>
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0">
          <MoreVertical className="w-3 h-3" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{chat.lastMessage}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Bot className="w-3 h-3 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">{chat.agentName}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {chat.messageCount}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatTime(chat.timestamp)}</span>
        </div>
      </div>
    </div>
  );

  const renderChatGroup = (title: string, chats: ChatSession[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h5 className="text-xs font-medium text-muted-foreground mb-2 px-2">{title}</h5>
        <div className="space-y-1">
          {chats.map((chat) => (
            <ChatItem key={chat.id} chat={chat} />
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
          <Button onClick={onNewChat} size="sm">
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

        {/* Toggle Archived */}
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant={showArchived ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className="text-xs h-7"
          >
            <Archive className="w-3 h-3 mr-1" />
            Archived ({groupedChats.archived.length})
          </Button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderChatGroup('📌 Pinned', groupedChats.pinned)}
        {renderChatGroup('Today', groupedChats.today)}
        {renderChatGroup('Yesterday', groupedChats.yesterday)}
        {renderChatGroup('This Week', groupedChats.thisWeek)}
        {renderChatGroup('Older', groupedChats.older)}
        {showArchived && renderChatGroup('🗃️ Archived', groupedChats.archived)}

        {/* Empty State */}
        {Object.values(groupedChats).every((group) => group.length === 0) && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? 'No chats found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <Button onClick={onNewChat} variant="outline" size="sm">
                Start your first chat
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
