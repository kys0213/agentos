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
import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import ChatHistory from './ChatHistory';
import MessageRenderer from './MessageRenderer';

import { AppModeState, QuickAction } from '../../types/chat-types';

import { Agent, ChatSessionMetadata, MessageHistory } from '@agentos/core';
import {
  MockAgentOrchestrator,
  MockOrchestrationService,
  getAvailableAgents,
} from '../../services/mock';

interface ChatViewProps {
  onNavigate: (section: AppModeState['activeSection']) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigate }) => {
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

  // 서비스 인스턴스
  const orchestrationService = new MockOrchestrationService();
  const orchestrator = new MockAgentOrchestrator();
  const availableAgents = getAvailableAgents();

  // Main Agent (Orchestrator) configuration
  const mainAgent = MockAgentOrchestrator.getMainAgent();

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

  const handleSelectChat = (chat: ChatSessionMetadata) => {
    setSelectedChat(chat);

    // Get primary agent name from joinedAgents
    const primaryAgent = chat.joinedAgents?.[0]?.name || 'AgentOS';

    // Load mock messages for the selected chat
    const mockMessages: MessageHistory[] = [
      {
        messageId: '1',
        role: 'system',
        content: { contentType: 'text', value: `${primaryAgent}와의 대화를 계속합니다.` },
        createdAt: new Date(),
      },
      {
        messageId: '2',
        role: 'user',
        content: { contentType: 'text', value: '이전 대화를 이어서 진행하고 싶습니다.' },
        createdAt: new Date(),
      },
      {
        messageId: '3',
        role: 'assistant',
        content: { contentType: 'text', value: '이전 대화를 이어서 진행하고 싶습니다.' },
        createdAt: new Date(),
      },
    ];
    setMessages(mockMessages);
  };

  const handleNewChat = () => {
    setSelectedChat(null);
    setActiveAgents([]);
    setCompletedOrchestrations({});
    setExpandedOrchestrations({});
    setCurrentOrchestrationSteps([]);
    setMessages([
      {
        messageId: '1',
        role: 'assistant',
        content: {
          contentType: 'text',
          value:
            'AgentOS에 오신 것을 환영합니다! 저는 여러 전문 에이전트를 관리하는 오케스트레이터입니다. 질문해주시면 적절한 전문가를 배정해드릴게요.',
        },
        createdAt: new Date(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: MessageHistory = {
      messageId: (messages.length + 1).toString(),
      role: 'user',
      content: { contentType: 'text', value: inputMessage },
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    if (orchestrationMode && activeAgents.length > 0) {
      // Orchestrated mode with orchestration steps
      setTimeout(() => {
        const { matchedAgents, steps } = orchestrationService.analyzeQueryWithSteps(
          currentQuery,
          activeAgents.map((a) => a.id)
        );
        setCurrentOrchestrationSteps(steps);

        // Create orchestrated message
        const orchestratedMessage: MessageHistory = {
          messageId: (messages.length + 2).toString(),
          role: 'assistant',
          content: {
            contentType: 'text',
            value:
              matchedAgents.length > 0
                ? `질문을 분석하여 ${matchedAgents.length}개의 전문 에이전트를 선택했습니다.`
                : '질문을 분석하여 직접 답변을 제공합니다.',
          },
          createdAt: new Date(),
        };

        setMessages((prev) => [...prev, orchestratedMessage]);

        setTimeout(() => {
          setIsTyping(false);

          // Store orchestration steps for the completed message
          const orchestratedMessageId = (messages.length + 2).toString();
          setCompletedOrchestrations((prev) => ({
            ...prev,
            [orchestratedMessageId]: steps,
          }));

          // Update the orchestrated message with agent metadata and completion status
          setMessages((prev) => {
            const updatedMessages = [...prev];
            const orchestratedMsgIndex = updatedMessages.findIndex(
              (msg) => msg.messageId === orchestratedMessageId
            );

            if (orchestratedMsgIndex !== -1) {
              updatedMessages[orchestratedMsgIndex] = {
                ...updatedMessages[orchestratedMsgIndex],
                agentMetadata: {
                  id: mainAgent.id,
                  name: mainAgent.name,
                  description: 'Orchestration completed',
                  icon: mainAgent.icon,
                  keywords: [],
                },
              };
            }
            return updatedMessages;
          });

          setCurrentOrchestrationSteps([]);

          if (matchedAgents.length > 0) {
            // Generate responses from matched agents
            const responses = matchedAgents.map((agentId, index): MessageHistory => {
              return {
                messageId: (messages.length + 3 + index).toString(),
                role: 'assistant',
                content: {
                  contentType: 'text',
                  value: orchestrator.getAgentResponse(agentId, currentQuery),
                },
                createdAt: new Date(),
              };
            });

            setMessages((prev) => [...prev, ...responses]);
          } else {
            // Main agent responds directly
            const directResponse: MessageHistory = {
              messageId: (messages.length + 3).toString(),
              role: 'assistant',
              content: {
                contentType: 'text',
                value: orchestrator.getDirectResponse(currentQuery),
              },
              createdAt: new Date(),
            };

            setMessages((prev) => [...prev, directResponse]);
          }
        }, 2500);
      }, 500);
    } else {
      // Direct mode (all active agents respond)
      setTimeout(() => {
        setIsTyping(false);

        if (activeAgents.length === 0) {
          const defaultResponse: MessageHistory = {
            messageId: (messages.length + 2).toString(),
            role: 'assistant',
            content: {
              contentType: 'text',
              value: '안녕하세요! 더 나은 도움을 위해 오른쪽에서 전문 에이전트를 선택해주세요.',
            },
            createdAt: new Date(),
          };
          setMessages((prev) => [...prev, defaultResponse]);
        } else {
          const responses = activeAgents.map(
            (agent, index): MessageHistory => ({
              messageId: (messages.length + 2 + index).toString(),
              role: 'assistant',
              content: {
                contentType: 'text',
                value: `[${agent.name}] ${orchestrator.getAgentResponse(agent.id, currentQuery)}`,
              },
              createdAt: new Date(),
            })
          );

          setMessages((prev) => [...prev, ...responses]);
        }
      }, 1500);
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

  const handleAgentSelect = (agent: (typeof availableAgents)[0]) => {
    const newAgent: Agent = orchestrator.convertToActiveAgent(agent);

    if (activeAgents.some((a) => a.id === agent.id)) {
      return;
    }

    setActiveAgents((prev) => [...prev, newAgent]);

    const agentMessage: MessageHistory = {
      messageId: (messages.length + 1).toString(),
      role: 'system',
      content: {
        contentType: 'text',
        value: `${agent.name}이 대화에 참여했습니다. ${orchestrationMode ? '오케스트레이터가 필요시 자동으로 배정할 예정입니다.' : agent.description}`,
      },
      createdAt: new Date(),
    };
    setMessages([...messages, agentMessage]);
  };

  const toggleOrchestrationSteps = (messageId: string) => {
    setExpandedOrchestrations((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const handleRemoveAgent = (agentId: string) => {
    const agent = activeAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setActiveAgents((prev) => prev.filter((a) => a.id !== agentId));
    setSelectedAgentForMenu(null);

    const leaveMessage: MessageHistory = {
      messageId: (messages.length + 1).toString(),
      role: 'system',
      content: {
        contentType: 'text',
        value: `${agent.name}이 대화에서 나갔습니다.`,
      },
      createdAt: new Date(),
    };
    setMessages([...messages, leaveMessage]);
  };

  const renderAgentAvatars = () => {
    const maxVisible = 4;
    const visibleAgents = activeAgents.slice(0, maxVisible);
    const remainingCount = Math.max(0, activeAgents.length - maxVisible);

    return (
      <div className="flex items-center">
        <div className="flex items-center -space-x-2">
          {/* Main Agent (Orchestrator) */}
          {orchestrationMode && (
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
                  className={`relative w-8 h-8 p-0 ${orchestrator.getAgentColor(agent)} rounded-full flex items-center justify-center border-2 border-white hover:scale-110 transition-transform`}
                  style={{ zIndex: visibleAgents.length - index }}
                >
                  <span className="text-xs text-white">{agent.icon}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${orchestrator.getAgentColor(agent)} rounded-full flex items-center justify-center`}
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
                    <UserMinus className="w-4 h-4" />
                    Remove from chat
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          ))}

          {remainingCount > 0 && (
            <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center border-2 border-white text-xs text-white font-medium">
              +{remainingCount}
            </div>
          )}
        </div>

        {showAgentPanel && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 ml-3 rounded-full">
                <Plus className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <div className="p-3 border-b">
                <h4 className="font-medium">Add Agent to Chat</h4>
                <p className="text-xs text-muted-foreground">
                  {orchestrationMode
                    ? 'Add specialists that the orchestrator can call upon'
                    : 'Select an agent to join the conversation'}
                </p>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {availableAgents
                  .filter((agent) => !activeAgents.some((a) => a.id === agent.id))
                  .map((agent) => (
                    <div
                      key={agent.id}
                      className="w-full p-3 hover:bg-gray-50 flex items-center gap-3 cursor-pointer border-b last:border-b-0 transition-colors"
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <div
                        className={`w-8 h-8 ${orchestrator.getAgentColor(agent)} rounded-full flex items-center justify-center flex-shrink-0`}
                      >
                        <span className="text-sm text-white">{agent.icon}</span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{agent.name}</span>
                          <Badge
                            variant={agent.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {agent.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{agent.description}</p>
                      </div>
                    </div>
                  ))}
                {availableAgents.filter((agent) => !activeAgents.some((a) => a.id === agent.id))
                  .length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    All available agents are already in the chat
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
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
                    <action.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message: MessageHistory) => (
            <MessageRenderer
              key={message.messageId}
              message={message}
              mode="full"
              showTimestamp={true}
              showActions={message.role === 'assistant'}
              availableAgents={availableAgents}
              mainAgent={mainAgent}
              onOrchestrationToggle={toggleOrchestrationSteps}
              orchestrationSteps={completedOrchestrations[message.messageId]}
              isOrchestrationExpanded={expandedOrchestrations[message.messageId]}
              getAgentColor={(agent) => orchestrator.getAgentColor(agent)}
            />
          ))}

          {isTyping && (
            <div className="space-y-4">
              {/* Orchestration Steps during typing */}
              {orchestrationMode && currentOrchestrationSteps.length > 0 && (
                <div className="p-4 rounded-lg border bg-purple-50 border-purple-200 max-w-4xl">
                  <div className="flex items-start gap-3">
                    <Brain className="w-6 h-6 text-purple-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-sm font-medium">AgentOS (Orchestration)</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date().toLocaleString()}
                        </span>
                      </div>
                      <div className="mt-4 space-y-3">
                        {currentOrchestrationSteps.map((step) => (
                          <MessageRenderer
                            key={step.messageId}
                            message={step}
                            mode="compact"
                            showTimestamp={false}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator */}
              <div className="flex items-center gap-3 text-muted-foreground">
                {orchestrationMode && currentOrchestrationSteps.length > 0 ? (
                  <Brain className="w-4 h-4 text-purple-500" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-sm">
                  {orchestrationMode && currentOrchestrationSteps.length > 0
                    ? 'AI orchestration in progress...'
                    : activeAgents.length > 0
                      ? `${activeAgents.length} agent${activeAgents.length > 1 ? 's' : ''} typing...`
                      : 'typing...'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  orchestrationMode
                    ? '질문을 입력하세요... (AI가 단계별로 사고하여 최적의 전문가를 찾아드립니다)'
                    : '메시지를 입력하세요...'
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="h-10 px-4"
            >
              <Send className="w-4 h-4" />
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
                      <p className="text-xs text-gray-600 mb-1 font-medium">{agent.preset.name}</p>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                        {agent.description}
                      </p>
                      {orchestrationMode && (
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
