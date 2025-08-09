import { useState } from 'react';
import { ChatHistory } from './ChatHistory';
import { MessageInputWithMentions } from './MessageInputWithMentions';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  Settings,
  Bot,
  Users,
  MessageSquare,
  CheckCircle,
  Clock,
  MinusCircle,
  Zap,
  Search,
  Database,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'idle' | 'inactive';
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  agentName?: string;
  agentId?: string;
  timestamp: Date;
  mentionedAgents?: Agent[];
}

interface ChatViewProps {
  onNavigate: (section: string) => void;
  agents: Agent[];
  mentionableAgents: Agent[];
  activeAgents: Agent[];
}

export function ChatView({ onNavigate, agents, mentionableAgents, activeAgents }: ChatViewProps) {
  const [selectedChatId, setSelectedChatId] = useState<string | null>('chat-1');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      content: 'Hello! I need help with analyzing some research data. Can you assist me?',
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: 'msg-2',
      content:
        "I'd be happy to help you analyze your research data! Could you share more details about the type of data you're working with and what specific analysis you need?",
      sender: 'agent',
      agentName: 'Research Assistant',
      agentId: 'agent-research-001',
      timestamp: new Date(Date.now() - 1000 * 60 * 29),
    },
    {
      id: 'msg-3',
      content:
        "It's survey data from about 500 respondents. I need to identify key trends and create some visualizations.",
      sender: 'user',
      timestamp: new Date(Date.now() - 1000 * 60 * 25),
    },
    {
      id: 'msg-4',
      content:
        'Perfect! For survey data analysis and visualization, I can help you with statistical analysis and creating meaningful charts. Let me start by asking about your survey structure...',
      sender: 'agent',
      agentName: 'Research Assistant',
      agentId: 'agent-research-001',
      timestamp: new Date(Date.now() - 1000 * 60 * 24),
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

  const handleSendMessage = (messageContent: string, mentionedAgents: Agent[]) => {
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageContent,
      sender: 'user',
      timestamp: new Date(),
      mentionedAgents: mentionedAgents.length > 0 ? mentionedAgents : undefined,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate agent response
    setTimeout(() => {
      let respondingAgent: Agent | null = null;

      // If specific agents were mentioned, use the first mentioned agent
      if (mentionedAgents.length > 0) {
        respondingAgent = mentionedAgents[0];
      } else {
        // Otherwise, let the orchestrator choose from active agents
        const availableActiveAgents = activeAgents.filter((agent) => agent.status === 'active');
        if (availableActiveAgents.length > 0) {
          // Simple orchestration logic - for demo purposes
          if (
            messageContent.toLowerCase().includes('code') ||
            messageContent.toLowerCase().includes('programming')
          ) {
            respondingAgent =
              availableActiveAgents.find((a) => a.category === 'development') ||
              availableActiveAgents[0];
          } else if (
            messageContent.toLowerCase().includes('research') ||
            messageContent.toLowerCase().includes('data')
          ) {
            respondingAgent =
              availableActiveAgents.find((a) => a.category === 'research') ||
              availableActiveAgents[0];
          } else if (
            messageContent.toLowerCase().includes('write') ||
            messageContent.toLowerCase().includes('content')
          ) {
            respondingAgent =
              availableActiveAgents.find((a) => a.category === 'creative') ||
              availableActiveAgents[0];
          } else {
            respondingAgent = availableActiveAgents[0];
          }
        }
      }

      if (respondingAgent) {
        const agentMessage: Message = {
          id: `msg-${Date.now()}-agent`,
          content: `I understand you need help with "${messageContent}". ${mentionedAgents.length > 0 ? 'Thanks for mentioning me directly! ' : 'As your active assistant, '}I'm here to help you with this request.`,
          sender: 'agent',
          agentName: respondingAgent.name,
          agentId: respondingAgent.id,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, agentMessage]);
      }
    }, 1000);
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
          <ChatHistory selectedChatId={selectedChatId} onSelectChat={setSelectedChatId} />
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
                  {getCategoryIcon(agent.category)}
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
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-4 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-white border'
                }`}
              >
                {message.sender === 'agent' && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">
                      <Bot className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-medium">{message.agentName}</span>
                    <Badge variant="secondary" className="text-xs">
                      Agent
                    </Badge>
                  </div>
                )}

                <p className="text-sm">{message.content}</p>

                {message.mentionedAgents && message.mentionedAgents.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs opacity-70">Mentioned:</span>
                    {message.mentionedAgents.map((agent) => (
                      <span
                        key={agent.id}
                        className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded"
                      >
                        @{agent.name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-xs opacity-70">
                  {message.timestamp.toLocaleTimeString()}
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
