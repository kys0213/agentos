import type { AgentMetadata, MessageHistory, ReadonlyAgentMetadata } from '@agentos/core';
import {
  Bot,
  CheckCircle,
  Clock,
  Copy,
  Database,
  MessageSquare,
  MinusCircle,
  Search,
  Settings,
  ThumbsDown,
  ThumbsUp,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ChatHistory } from './ChatHistory';
import { MessageInputWithMentions } from './MessageInputWithMentions';
import MessageRenderer from './MessageRenderer';
import { AppSection } from '../../stores/store-types';
import { EmptyState } from '../layout/EmptyState';

interface ChatViewProps {
  onNavigate: (section: AppSection) => void;
  mentionableAgents: ReadonlyAgentMetadata[];
  activeAgents: ReadonlyAgentMetadata[];
  messages: Readonly<MessageHistory>[];
  selectedAgentId?: string;
  onSelectAgent: (agentId: string) => void;
  onSendMessage: (messageContent: string, mentionedAgents: AgentMetadata[]) => void;
  isTyping?: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onNavigate,
  mentionableAgents,
  activeAgents,
  messages,
  selectedAgentId,
  onSelectAgent,
  onSendMessage,
  isTyping = false,
}) => {
  const selectedChatId = useMemo(() => selectedAgentId, [selectedAgentId]);

  const selectedAgent = useMemo(() => {
    if (!selectedAgentId) {
      return activeAgents[0] ?? mentionableAgents[0];
    }
    return (
      mentionableAgents.find((agent) => agent.id === selectedAgentId) ||
      activeAgents.find((agent) => agent.id === selectedAgentId)
    );
  }, [activeAgents, mentionableAgents, selectedAgentId]);

  const hasAgents = mentionableAgents.length > 0 || activeAgents.length > 0;
  const hasMessages = messages.length > 0;

  // memoized derived counts to avoid recalculation per render
  const idleCount = useMemo(
    () => mentionableAgents.filter((a) => a.status === 'idle').length,
    [mentionableAgents]
  );
  const inactiveCount = useMemo(
    () => mentionableAgents.filter((a) => a.status === 'inactive').length,
    [mentionableAgents]
  );

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'research':
        return <Search className="w-4 h-4" />;
      case 'development':
        return <Bot className="w-4 h-4" />;
      case 'creative':
        return <Zap className="w-4 h-4" />;
      case 'analytics':
        return <Database className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="text-xs gap-1 status-active-subtle">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="text-xs gap-1 status-idle-subtle">
            <Clock className="w-3 h-3" />
            Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="text-xs gap-1 status-inactive-subtle">
            <MinusCircle className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleSendMessage = (messageContent: string, mentionedAgents: AgentMetadata[]) => {
    onSendMessage(messageContent, mentionedAgents);
  };

  const renderAgentChip = (agent: ReadonlyAgentMetadata) => (
    <div
      key={agent.id}
      className="flex items-center gap-2 bg-background px-3 py-2 rounded-lg border hover:bg-muted transition-colors"
    >
      <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
        {getCategoryIcon(agent.preset?.category?.[0])}
      </div>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-foreground">{agent.name}</span>
        {agent.description && (
          <span className="text-[11px] text-muted-foreground line-clamp-1">
            {agent.description}
          </span>
        )}
      </div>
      {getStatusBadge(agent.status)}
    </div>
  );

  const renderMessageActions = (isAgent: boolean) => {
    if (!isAgent) {
      return null;
    }
    return (
      <div className="mt-3 flex gap-2">
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
          <Copy className="w-3 h-3" />
          Copy
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
          <ThumbsUp className="w-3 h-3" />
          Good
        </Button>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2">
          <ThumbsDown className="w-3 h-3" />
          Bad
        </Button>
      </div>
    );
  };

  return (
    <div className="h-full flex">
      {/* Chat History Sidebar */}
      <div className="w-80 border-r bg-background flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Chat History</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('dashboard')}
              className="gap-2"
            >
              <Settings className="w-4 h-4" />
              Manage
            </Button>
          </div>

          {/* Active Agents Summary */}
          <Card className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Agent Status</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-status-active" />
                <span>Active: {activeAgents.length}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-status-idle" />
                <span>Idle: {idleCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <MinusCircle className="w-3 h-3 text-status-inactive" />
                <span>Off: {inactiveCount}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-1 min-h-0">
          <ChatHistory
            agents={mentionableAgents}
            selectedChatId={selectedChatId}
            onSelectChat={onSelectAgent}
            lastMessageByAgentId={{}}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-foreground">
                    {selectedAgent?.name ?? 'Conversation'}
                  </h1>
                  {selectedAgent?.preset?.name && (
                    <Badge variant="outline" className="text-xs">
                      {selectedAgent.preset.name}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedAgent?.description || 'Collaborate with your agents in real-time chats.'}
                </p>
                {activeAgents.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {activeAgents.length} active
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      {idleCount} idle
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      {inactiveCount} inactive
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onNavigate('subagents')}
                className="gap-2"
              >
                <Settings className="w-4 h-4" />
                Manage Agents
              </Button>
            </div>
          </div>
        </div>

        {/* Available Agents Panel */}
        <div className="p-4 bg-muted/30 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Available Agents</span>
            <Badge variant="outline" className="text-xs">
              {mentionableAgents.length} mentionable
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {mentionableAgents.slice(0, 6).map((agent) => renderAgentChip(agent))}
            {mentionableAgents.length > 6 && (
              <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                +{mentionableAgents.length - 6} more agents...
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasAgents && (
            <div className="max-w-xl mx-auto">
              <EmptyState
                type="chat"
                title="Create your first agent"
                description="Chats become available once you have at least one active agent. Create an agent to start collaborating."
                actionLabel="Create Agent"
                onAction={() => onNavigate('subagents')}
                secondaryAction={{
                  label: 'View Agent Library',
                  onClick: () => onNavigate('subagents'),
                }}
              />
            </div>
          )}

          {hasAgents && !hasMessages && (
            <div className="max-w-xl mx-auto">
              <EmptyState
                type="chat"
                title="Start a new conversation"
                description="Active agents respond automatically. Mention a specific agent with '@' for targeted help."
                actionLabel="Open Agent Manager"
                onAction={() => onNavigate('subagents')}
              />
            </div>
          )}

          {messages.map((message) => {
            const isUser = message.role === 'user';
            return (
              <div
                key={message.messageId}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[76%] rounded-2xl border p-4 shadow-sm ${
                    isUser
                      ? 'bg-primary text-primary-foreground border-transparent shadow-primary/20'
                      : 'bg-card text-foreground border-border'
                  }`}
                >
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 bg-muted rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {message.agentMetadata?.name ?? 'Assistant'}
                      </span>
                      <Badge variant="secondary" className="text-[11px]">
                        Agent
                      </Badge>
                    </div>
                  )}

                  <MessageRenderer
                    message={message}
                    mode="full"
                    showTimestamp={false}
                    showActions={false}
                    showAgentBadge={false}
                    availableAgents={mentionableAgents}
                    mainAgent={activeAgents[0]}
                  />

                  {message.agentMetadata && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Responding as @{message.agentMetadata.name}
                    </div>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    {message.createdAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>

                  {renderMessageActions(!isUser)}
                </div>
              </div>
            );
          })}

          {hasAgents && isTyping && (
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 rounded-full border px-4 py-2 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <span
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </span>
                <span>Assistant is thinking…</span>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-background">
          <MessageInputWithMentions
            mentionableAgents={mentionableAgents}
            onSendMessage={handleSendMessage}
            placeholder={`Type a message... (Use @ to mention specific agents, or let ${activeAgents.length} active agents respond automatically)`}
            disabled={!hasAgents}
          />
        </div>
      </div>
    </div>
  );
};
