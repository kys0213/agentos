import {
  BarChart3,
  Bot,
  Brain,
  ChevronLeft,
  ChevronRight,
  Code,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Settings,
  UserMinus,
  X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import ChatHistory from './ChatHistory';
import MessageRenderer from './MessageRenderer';

import { AppModeState, QuickAction } from '../../types/chat-types';

import { Agent, ChatSessionMetadata, MessageHistory } from '@agentos/core';
import { ServiceContainer } from '../../services/ServiceContainer';
import type { ChatService } from '../../services/chat-service';

interface ChatViewProps {
  onNavigate: (section: AppModeState['activeSection']) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigate }) => {
  // State management - restored from original
  const [messages, setMessages] = useState<MessageHistory[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatSessionMetadata | null>(null);
  const [activeAgents, setActiveAgents] = useState<Agent[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [selectedAgentForMenu, setSelectedAgentForMenu] = useState<string | null>(null);
  const [orchestrationMode, setOrchestrationMode] = useState(true);
  const [currentOrchestrationSteps, setCurrentOrchestrationSteps] = useState<MessageHistory[]>([]);
  const [completedOrchestrations, setCompletedOrchestrations] = useState<
    Record<string, MessageHistory[]>
  >({});
  const [expandedOrchestrations, setExpandedOrchestrations] = useState<Record<string, boolean>>({});

  // Services - Refactored: replaced mock services with real services
  const chatService = ServiceContainer.get<ChatService>('chat');
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [mainAgent, setMainAgent] = useState<any>(null);

  // Load data from real services instead of mock
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // TODO: Load available agents from actual agent service when available
        // For now, provide mock structure to maintain UI functionality
        const mockAvailableAgents = [
          {
            id: '1',
            name: 'Data Analyst',
            icon: '📊',
            description: 'Data analysis expert',
            status: 'active',
            preset: { name: 'Data Analysis' },
            keywords: ['data', 'analysis', 'visualization'],
          },
          {
            id: '2',
            name: 'Code Reviewer',
            icon: '🔍',
            description: 'Code review specialist',
            status: 'active',
            preset: { name: 'Code Review' },
            keywords: ['code', 'review', 'quality'],
          },
          {
            id: '3',
            name: 'Writer',
            icon: '✍️',
            description: 'Writing assistant',
            status: 'active',
            preset: { name: 'Writing' },
            keywords: ['writing', 'content', 'documentation'],
          },
        ];
        setAvailableAgents(mockAvailableAgents);

        const mockMainAgent = { id: 'main', name: 'AgentOS', icon: '🤖' };
        setMainAgent(mockMainAgent);

        // Initialize with welcome message
        const welcomeMessage: MessageHistory = {
          messageId: '1',
          role: 'assistant',
          content: {
            contentType: 'text',
            value: '안녕하세요! AgentOS입니다. 무엇을 도와드릴까요?',
          },
          createdAt: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      label: '데이터 분석',
      icon: BarChart3,
      description: 'CSV, JSON 데이터 분석 및 시각화',
      category: 'chat',
    },
    {
      id: 'code-review',
      label: '코드 리뷰',
      icon: Code,
      description: '코드 품질 검토 및 개선 제안',
      category: 'chat',
    },
    {
      id: 'writing',
      label: '글쓰기 도움',
      icon: FileText,
      description: '문서 작성 및 편집 지원',
      category: 'chat',
    },
    {
      id: 'image-gen',
      label: '이미지 생성',
      icon: ImageIcon,
      description: 'AI를 활용한 이미지 생성',
      category: 'chat',
    },
  ];

  const handleSelectChat = async (chat: ChatSessionMetadata) => {
    try {
      setSelectedChat(chat);

      // Load messages from real service instead of mock
      const messagesResponse = await chatService.getMessages(chat.sessionId);
      // Convert MessageRecord[] to MessageHistory[] if needed
      const messages = (messagesResponse.messages || []) as unknown as MessageHistory[];
      setMessages(messages);
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      // Fallback to basic message
      setMessages([
        {
          messageId: '1',
          role: 'assistant',
          content: {
            contentType: 'text',
            value: '대화를 불러오는 중에 문제가 발생했습니다.',
          },
          createdAt: new Date(),
        },
      ]);
    }
  };

  const handleNewChat = async () => {
    try {
      const newSession = await chatService.createSession();
      setSelectedChat(newSession);

      const welcomeMessage: MessageHistory = {
        messageId: '1',
        role: 'assistant',
        content: {
          contentType: 'text',
          value: '새로운 대화를 시작합니다. 무엇을 도와드릴까요?',
        },
        createdAt: new Date(),
      };
      setMessages([welcomeMessage]);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: MessageHistory = {
      messageId: (messages.length + 1).toString(),
      role: 'user',
      content: {
        contentType: 'text',
        value: inputMessage,
      },
      createdAt: new Date(),
    };

    const currentQuery = inputMessage;
    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Send message through real service if chat is selected
      if (selectedChat) {
        const response = await chatService.sendMessage(selectedChat.sessionId, currentQuery);

        const assistantMessage: MessageHistory = {
          messageId: (messages.length + 2).toString(),
          role: 'assistant',
          content: {
            contentType: 'text',
            value: (response as any)?.content || '응답을 생성하는 중에 문제가 발생했습니다.',
          },
          createdAt: new Date(),
        };

        setTimeout(() => {
          setIsTyping(false);
          setMessages((prev) => [...prev, assistantMessage]);
        }, 1500);
      } else {
        // Fallback response when no chat is selected
        setTimeout(() => {
          setIsTyping(false);
          const fallbackResponse: MessageHistory = {
            messageId: (messages.length + 2).toString(),
            role: 'assistant',
            content: {
              contentType: 'text',
              value: '새 채팅을 시작하려면 왼쪽 상단의 "+" 버튼을 클릭해주세요.',
            },
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, fallbackResponse]);
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setTimeout(() => {
        setIsTyping(false);
        const errorMessage: MessageHistory = {
          messageId: (messages.length + 2).toString(),
          role: 'assistant',
          content: {
            contentType: 'text',
            value: '메시지 전송 중에 오류가 발생했습니다.',
          },
          createdAt: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }, 1000);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    const actionMessage: MessageHistory = {
      messageId: (messages.length + 1).toString(),
      role: 'user',
      content: {
        contentType: 'text',
        value: `${action.label}: ${action.description}`,
      },
      createdAt: new Date(),
    };
    setMessages([...messages, actionMessage]);
  };

  const handleAgentSelect = (agent: any) => {
    const newAgent: Agent = {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      preset: {
        id: agent.id,
        name: agent.name,
        description: agent.description,
        author: 'System',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        systemPrompt: '',
        llmBridgeName: 'default',
        llmBridgeConfig: {},
      },
      keywords: [],
      status: 'active',
      sessionCount: 0,
      run: async () => ({ messages: [], sessionId: '' }),
    } as Agent;

    if (!activeAgents.find((a) => a.id === newAgent.id)) {
      setActiveAgents([...activeAgents, newAgent]);
    }
  };

  const handleRemoveAgent = (agentId: string) => {
    setActiveAgents(activeAgents.filter((a) => a.id !== agentId));
    setSelectedAgentForMenu(null);
  };

  const getAgentColor = (agent: Agent) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const index = agent.id.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const renderAgentAvatars = () => {
    const visibleAgents = activeAgents.slice(0, 4);
    const hiddenCount = Math.max(0, activeAgents.length - 4);

    return (
      <div className="flex items-center">
        <div className="flex items-center -space-x-2">
          {/* Main Agent (Orchestrator) */}
          {orchestrationMode && mainAgent && (
            <div className="relative w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center border-2 border-white z-50">
              <span className="text-xs text-white">{mainAgent.icon}</span>
              {currentOrchestrationSteps.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-400 rounded-full animate-pulse"></div>
              )}
            </div>
          )}

          {/* Specialist Agents */}
          {visibleAgents.map((agent, index) => (
            <Popover
              key={agent.id}
              open={selectedAgentForMenu === agent.id}
              onOpenChange={(open) => setSelectedAgentForMenu(open ? agent.id : null)}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`relative w-8 h-8 p-0 ${getAgentColor(agent)} rounded-full flex items-center justify-center border-2 border-white hover:scale-110 transition-transform`}
                  style={{ zIndex: visibleAgents.length - index }}
                >
                  <span className="text-xs text-white">{agent.icon}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${getAgentColor(agent)} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-lg text-white">{agent.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.preset.name}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{agent.description}</p>
                </div>
                <div className="p-2">
                  <div
                    className="w-full flex items-center justify-start gap-2 px-3 py-2 text-sm text-destructive hover:bg-gray-50 cursor-pointer rounded-md transition-colors"
                    onClick={() => handleRemoveAgent(agent.id)}
                  >
                    <UserMinus className="w-3 h-3" />
                    Remove Agent
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}

          {/* More agents indicator */}
          {hiddenCount > 0 && (
            <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-xs text-white font-medium">+{hiddenCount}</span>
            </div>
          )}
        </div>

        {/* Add Agent Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="ml-3 h-8 w-8 p-0">
              <Plus className="w-3 h-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="start">
            <div className="p-4 border-b">
              <h4 className="font-medium">Available Agents</h4>
              <p className="text-sm text-muted-foreground">
                Select agents to join the conversation
              </p>
            </div>
            <div className="p-2 space-y-2 max-h-60 overflow-y-auto">
              {availableAgents.map((agent) => (
                <div
                  key={agent.id}
                  className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => handleAgentSelect(agent)}
                >
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm">{agent.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{agent.name}</div>
                    <div className="text-xs text-gray-600 truncate">{agent.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      {/* Chat History Sidebar */}
      <ChatHistory
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        selectedChatId={selectedChat?.sessionId}
        onNavigate={onNavigate}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Chat Header with Orchestration Mode Toggle */}
        <div className="border-b bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">
                  {selectedChat ? selectedChat.title : 'New Chat'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {orchestrationMode ? (
                    <span className="flex items-center gap-1">
                      <Brain className="w-3 h-3 text-purple-500" />
                      Orchestration Mode • {activeAgents.length} specialist
                      {activeAgents.length > 1 ? 's' : ''} available
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Bot className="w-3 h-3 text-blue-500" />
                      {activeAgents.length} agent{activeAgents.length > 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
              </div>

              {/* Agent Avatars */}
              {(orchestrationMode || activeAgents.length > 0) && (
                <div className="ml-4">{renderAgentAvatars()}</div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant={orchestrationMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrchestrationMode(!orchestrationMode)}
                className="h-8"
              >
                <Brain className="w-3 h-3 mr-2" />
                {orchestrationMode ? 'Orchestration' : 'Direct Mode'}
              </Button>
              <Button variant="outline" size="sm" className="h-8">
                <Settings className="w-3 h-3 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgentPanel(!showAgentPanel)}
                className="h-8 w-8 p-0"
              >
                {showAgentPanel ? (
                  <ChevronRight className="w-3 h-3" />
                ) : (
                  <ChevronLeft className="w-3 h-3" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 1 && !selectedChat && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {orchestrationMode ? 'AI 리즈닝 모드' : '직접 대화 모드'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {orchestrationMode
                  ? 'AI가 단계별 사고 과정을 통해 최적의 전문가를 찾아드립니다'
                  : '선택한 모든 에이전트가 직접 응답합니다'}
              </p>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col gap-2"
                    onClick={() => handleQuickAction(action)}
                  >
                    <action.icon className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => (
            <MessageRenderer
              key={message.messageId}
              message={message}
              showTimestamp={index === messages.length - 1}
              showAgentBadge={true}
            />
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-gray-500" />
              </div>
              <div className="bg-gray-100 rounded-2xl px-4 py-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t bg-white p-4">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <Button variant="outline" size="sm" className="mb-2">
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="resize-none"
              />
            </div>

            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="mb-2"
            >
              <Send className="w-4 h-4 mr-2" />
              전송
            </Button>
          </div>
        </div>
      </div>

      {/* Agent Selection Panel */}
      {showAgentPanel && (
        <div className="w-80 bg-muted flex flex-col border-l border-gray-100">
          <div className="px-4 py-4 border-b bg-background">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Available Agents</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAgentPanel(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {orchestrationMode
                ? 'Add specialists for the AI to reason with'
                : 'Click to add agents to the conversation'}
            </p>
          </div>

          <div className="flex-1 p-3 space-y-2">
            {availableAgents.map((agent, index) => {
              const isActive = activeAgents.some((a) => a.id === agent.id);

              return (
                <Card
                  key={index}
                  className={`p-3 cursor-pointer transition-all duration-200 ${
                    isActive
                      ? 'border-green-500 bg-green-50 shadow-sm'
                      : 'hover:shadow-md hover:border-gray-100'
                  }`}
                  onClick={() => handleAgentSelect(agent)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 ${isActive ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center shadow-sm`}
                    >
                      <span className="text-base">{agent.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-sm text-gray-900">{agent.name}</h4>
                        <Badge
                          variant={
                            isActive
                              ? 'default'
                              : agent.status === 'active'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs font-medium"
                        >
                          {isActive ? 'Available' : agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-1 font-medium">
                        {agent.preset?.name || 'Default Preset'}
                      </p>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                        {agent.description}
                      </p>
                      {orchestrationMode && agent.keywords && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {agent.keywords.slice(0, 3).map((keyword) => (
                            <span
                              key={keyword}
                              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-medium border border-blue-200"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="px-4 py-4 border-t bg-white">
            <Button variant="outline" className="w-full" onClick={() => onNavigate('subagents')}>
              <Settings className="w-4 h-4 mr-2" />
              Manage Agents
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatView;
