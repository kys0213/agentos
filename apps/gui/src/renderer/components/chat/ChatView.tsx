import { AgentMetadata, MessageHistory, Preset, ReadonlyAgentMetadata } from '@agentos/core';
import {
  Bot,
  CheckCircle,
  Clock,
  Database,
  MessageSquare,
  MinusCircle,
  Search,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ChatHistory } from './ChatHistory';
import { MessageInputWithMentions } from './MessageInputWithMentions';
import MessageRenderer from './MessageRenderer';
import { AppSection } from '../../stores/store-types';

interface ChatViewProps {
  onNavigate: (section: AppSection) => void;
  agents: ReadonlyAgentMetadata[];
  mentionableAgents: ReadonlyAgentMetadata[];
  activeAgents: ReadonlyAgentMetadata[];
}

export function ChatView({ onNavigate, agents, mentionableAgents, activeAgents }: ChatViewProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>('chat-1');

  const preset: Readonly<Preset> = {
    id: 'preset-research-001',
    name: 'Research Assistant',
    description: 'A research assistant that can help with analyzing research data',
    author: 'John Doe',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0',
    systemPrompt: 'You are a research assistant that can help with analyzing research data',
    enabledMcps: [],
    llmBridgeName: 'openai',
    llmBridgeConfig: {},
    status: 'active',
    usageCount: 0,
    knowledgeDocuments: 0,
    knowledgeStats: {
      indexed: 0,
      vectorized: 0,
      totalSize: 0,
    },
    category: ['research'],
  };

  const [messages, setMessages] = useState<Readonly<MessageHistory>[]>([
    {
      messageId: 'msg-1',
      role: 'user',
      content: {
        contentType: 'text',
        value: 'Hello! I need help with analyzing some research data. Can you assist me?',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      messageId: 'msg-2',
      role: 'assistant',
      content: {
        contentType: 'text',
        value:
          "I'd be happy to help you analyze your research data! Could you share more details about the type of data you're working with and what specific analysis you need?",
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 29),
      agentMetadata: {
        id: 'agent-research-001',
        name: 'Research Assistant',
        description: 'A research assistant that can help with analyzing research data',
        icon: '🔍',
        keywords: ['research', 'data', 'analysis'],
        preset: preset,
        sessionCount: 1,
        lastUsed: new Date(Date.now() - 1000 * 60 * 29),
        status: 'active',
        usageCount: 15,
      },
    },
    {
      messageId: 'msg-3',
      role: 'user',
      content: {
        contentType: 'text',
        value:
          "It's survey data from about 500 respondents. I need to identify key trends and create some visualizations.",
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      messageId: 'msg-4',
      role: 'assistant',
      content: {
        contentType: 'text',
        value:
          'Perfect! For survey data analysis and visualization, I can help you with statistical analysis and creating meaningful charts. Let me start by asking about your survey structure...',
      },
      createdAt: new Date(Date.now() - 1000 * 60 * 24),
      agentMetadata: {
        id: 'agent-research-001',
        name: 'Research Assistant',
        description: 'A research assistant that can help with analyzing research data',
        icon: '🔍',
        keywords: ['research', 'data', 'analysis'],
        preset: {
          id: 'preset-research-001',
          name: 'Research Assistant',
          description: 'A research assistant that can help with analyzing research data',
          author: 'John Doe',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
          systemPrompt: 'You are a research assistant that can help with analyzing research data',
          enabledMcps: [],
          llmBridgeName: 'openai',
          llmBridgeConfig: {},
          status: 'active',
          usageCount: 0,
          knowledgeDocuments: 0,
          knowledgeStats: {
            indexed: 0,
            vectorized: 0,
            totalSize: 0,
          },
          category: ['research'],
        },
        status: 'active',
        sessionCount: 1,
        lastUsed: new Date(Date.now() - 1000 * 60 * 24),
        usageCount: 10,
      },
    },
  ]);

  const getCategoryIcon = (category: string) => {
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
    // Add user message
    const userMessage: MessageHistory = {
      role: 'user',
      content: {
        contentType: 'text',
        value: messageContent,
      },
      createdAt: new Date(),
      agentMetadata: mentionedAgents.length > 0 ? mentionedAgents[0] : undefined,
      messageId: 'msg-1',
    };

    setMessages((prev) => [...prev, userMessage]);

    // TODO agent 와 대화하기
  };

  return (
    <div className="h-full flex">
      {/* Chat History Sidebar */}
      <div className="w-80 border-r bg-white flex flex-col">
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
                <span>Idle: {agents.filter((a) => a.status === 'idle').length}</span>
              </div>
              <div className="flex items-center gap-1">
                <MinusCircle className="w-3 h-3 text-status-inactive" />
                <span>Off: {agents.filter((a) => a.status === 'inactive').length}</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="flex-1 min-h-0">
          <ChatHistory
            selectedChatId={selectedChatId || undefined}
            onSelectChat={setSelectedChatId}
          />
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-muted-foreground" />
              <div>
                <h1 className="text-lg font-semibold text-foreground">Research Data Analysis</h1>
                <p className="text-sm text-muted-foreground">
                  Active: {activeAgents.map((a) => a.name).join(', ') || 'No active agents'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onNavigate('subagents')}>
                Manage Agents
              </Button>
            </div>
          </div>
        </div>

        {/* Available Agents Panel */}
        <div className="p-4 bg-gray-50/50 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Bot className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Available Agents</span>
            <Badge variant="outline" className="text-xs">
              {mentionableAgents.length} mentionable
            </Badge>
          </div>

          <div className="flex flex-wrap gap-2">
            {mentionableAgents.slice(0, 6).map((agent) => (
              <div
                key={agent.id}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                  {getCategoryIcon(agent.preset.category[0])}
                </div>
                <span className="text-sm font-medium">{agent.name}</span>
                {getStatusBadge(agent.status)}
              </div>
            ))}
            {mentionableAgents.length > 6 && (
              <div className="flex items-center px-3 py-2 text-sm text-muted-foreground">
                +{mentionableAgents.length - 6} more agents...
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.messageId}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-white border'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{message.agentMetadata?.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      Agent
                    </Badge>
                  </div>
                )}

                <MessageRenderer
                  message={message}
                  mode="full"
                  showTimestamp={true}
                  showActions={true}
                  showAgentBadge={true}
                  availableAgents={mentionableAgents}
                  mainAgent={activeAgents[0]}
                />

                {message.agentMetadata && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs opacity-70">Mentioned:</span>
                    <span
                      key={message.agentMetadata.id}
                      className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                    >
                      @{message.agentMetadata.name}
                    </span>
                  </div>
                )}

                <div className="mt-2 text-xs opacity-70">
                  {message.createdAt.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          <MessageInputWithMentions
            mentionableAgents={mentionableAgents}
            onSendMessage={handleSendMessage}
            placeholder={`Type a message... (Use @ to mention specific agents, or let ${activeAgents.length} active agents respond automatically)`}
          />
        </div>
      </div>
    </div>
  );
}
