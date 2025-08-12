import type { ReadonlyAgentMetadata, MessageHistory } from '@agentos/core';
import { Archive, Bot, MessageSquare, MoreVertical, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import MessageRenderer from './MessageRenderer';

interface ChatHistoryProps {
  agents: ReadonlyAgentMetadata[];
  onSelectChat: (agentId: string) => void;
  selectedChatId?: string;
  lastMessageByAgentId?: Record<string, MessageHistory | undefined>;
}

export function ChatHistory({
  agents,
  onSelectChat,
  selectedChatId,
  lastMessageByAgentId = {},
}: ChatHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const filteredAgents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.keywords?.some((k) => k.toLowerCase().includes(q))
    );
  }, [searchQuery, agents]);

  const pinnedAgents: ReadonlyAgentMetadata[] = [];
  const visibleAgents = filteredAgents;

  return (
    <div className="w-80 border-r bg-white flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Chats</h2>
          <Button size="sm">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        <div className="mt-3">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            className="gap-2 h-8"
            onClick={() => setShowArchived((v) => !v)}
          >
            <Archive className="w-4 h-4" />
            Archived (0)
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {visibleAgents.length === 0 && !showArchived && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              {searchQuery ? 'No agents found' : 'No conversations yet'}
            </p>
          </div>
        )}

        {showArchived && (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-2">No archived conversations</p>
          </div>
        )}

        {pinnedAgents.length > 0 && (
          <div className="mt-2">
            <h5 className="mb-2">📌 Pinned</h5>
            <div className="space-y-2">
              {pinnedAgents.map((agent) => {
                const latest = lastMessageByAgentId[agent.id];
                return (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedChatId === agent.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onSelectChat(agent.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="text-sm font-medium truncate">{agent.name}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>

                    {latest && <MessageRenderer message={latest} mode="compact" />}

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Bot className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{agent.preset.name}</span>
                      </div>
                      {latest && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            1
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {latest.createdAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {visibleAgents.length > 0 && (
          <div className="mt-2">
            <h5 className="mb-2">Older</h5>
            <div className="space-y-2">
              {visibleAgents.map((agent) => {
                const latest = lastMessageByAgentId[agent.id];
                return (
                  <div
                    key={agent.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      selectedChatId === agent.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => onSelectChat(agent.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <h4 className="text-sm font-medium truncate">{agent.name}</h4>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </Button>
                    </div>

                    {latest && <MessageRenderer message={latest} mode="compact" />}

                    <div className="flex items-center justify-between mt-1">
                      <div className="flex items-center gap-1">
                        <Bot className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{agent.preset.name}</span>
                      </div>
                      {latest && (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs px-1.5 py-0">
                            1
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {latest.createdAt.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
