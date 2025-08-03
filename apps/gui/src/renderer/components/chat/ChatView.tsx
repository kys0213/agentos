import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import ChatHistory from './ChatHistory';
import {
  Send,
  Bot,
  User,
  Settings,
  Copy,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Plus,
  MessageSquare,
  Sparkles,
  Zap,
  Code,
  BarChart3,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ChevronRight,
  ChevronLeft,
  X,
  Home,
  Layers,
  Cpu,
  Wrench,
  Network,
  Users,
  Minus,
  UserMinus,
  Info,
  Brain,
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Search,
  Target,
  Lightbulb,
} from 'lucide-react';

import {
  ChatMessage,
  ReasoningStep,
  ChatSession,
  QuickAction,
  ActiveAgent,
  AppModeState,
} from '../../types/chat-types';

import {
  MockReasoningService,
  MockAgentOrchestrator,
  getAvailableAgents,
  getChatSessions,
} from '../../services/mock';

interface ChatViewProps {
  onNavigate: (section: AppModeState['activeSection']) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [activeAgents, setActiveAgents] = useState<ActiveAgent[]>([]);
  const [showAgentPanel, setShowAgentPanel] = useState(true);
  const [selectedAgentForMenu, setSelectedAgentForMenu] = useState<string | null>(null);
  const [orchestrationMode, setOrchestrationMode] = useState(true);
  const [currentReasoningSteps, setCurrentReasoningSteps] = useState<ReasoningStep[]>([]);

  // 서비스 인스턴스
  const reasoningService = new MockReasoningService();
  const orchestrator = new MockAgentOrchestrator();
  const availableAgents = getAvailableAgents();
  const chatSessions = getChatSessions();

  // Main Agent (Orchestrator) configuration
  const mainAgent = MockAgentOrchestrator.getMainAgent();

  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      label: '데이터 분석',
      icon: <BarChart3 className="w-4 h-4" />,
      description: 'CSV, JSON 데이터 분석 및 시각화',
      category: 'analysis',
    },
    {
      id: 'code-review',
      label: '코드 리뷰',
      icon: <Code className="w-4 h-4" />,
      description: '코드 품질 검토 및 개선 제안',
      category: 'development',
    },
    {
      id: 'writing',
      label: '글쓰기 도움',
      icon: <FileText className="w-4 h-4" />,
      description: '문서 작성 및 편집 지원',
      category: 'content',
    },
    {
      id: 'image-gen',
      label: '이미지 생성',
      icon: <ImageIcon className="w-4 h-4" />,
      description: 'AI를 활용한 이미지 생성',
      category: 'creative',
    },
  ];

  const quickNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'presets', label: 'Presets', icon: Layers },
    { id: 'subagents', label: 'Agents', icon: Bot },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'racp', label: 'RACP', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelectChat = (chat: ChatSession) => {
    setSelectedChat(chat);

    // Load mock messages for the selected chat
    const mockMessages: ChatMessage[] = [
      {
        id: 1,
        type: 'system',
        content: `${chat.agentName}와의 대화를 계속합니다.`,
        timestamp: '10:00 AM',
      },
      {
        id: 2,
        type: 'user',
        content: '이전 대화를 이어서 진행하고 싶습니다.',
        timestamp: '10:01 AM',
      },
      {
        id: 3,
        type: 'agent',
        content: chat.lastMessage,
        timestamp: '10:02 AM',
        agentName: chat.agentName,
        agentPreset: chat.agentPreset,
      },
    ];
    setMessages(mockMessages);
  };

  const handleNewChat = () => {
    setSelectedChat(null);
    setActiveAgents([]);
    setMessages([
      {
        id: 1,
        type: 'system',
        content:
          'AgentOS에 오신 것을 환영합니다! 저는 여러 전문 에이전트를 관리하는 오케스트레이터입니다. 질문해주시면 적절한 전문가를 배정해드릴게요.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    if (orchestrationMode && activeAgents.length > 0) {
      // Orchestrated mode with reasoning steps
      setTimeout(() => {
        const { matchedAgents, steps } = reasoningService.analyzeQueryWithSteps(
          currentQuery,
          activeAgents.map((a) => a.id)
        );
        setCurrentReasoningSteps(steps);

        // Create reasoning message
        const reasoningMessage: ChatMessage = {
          id: messages.length + 2,
          type: 'reasoning',
          content: '질문을 분석하여 적절한 전문가를 찾고 있습니다...',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: mainAgent.name,
          agentPreset: mainAgent.preset,
          agentId: mainAgent.id,
          reasoningSteps: steps,
        };

        setMessages((prev) => [...prev, reasoningMessage]);

        setTimeout(() => {
          setIsTyping(false);
          setCurrentReasoningSteps([]);

          if (matchedAgents.length > 0) {
            // Generate responses from matched agents
            const responses = matchedAgents.map((agentId, index) => {
              const agent = availableAgents.find((a) => a.id === agentId);
              return {
                id: messages.length + 3 + index,
                type: 'agent' as const,
                content: orchestrator.getAgentResponse(agent!, currentQuery),
                timestamp: new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                }),
                agentName: agent!.name,
                agentPreset: agent!.preset,
                agentId: agent!.id,
              };
            });

            setMessages((prev) => [...prev, ...responses]);
          } else {
            // Main agent responds directly
            const directResponse: ChatMessage = {
              id: messages.length + 3,
              type: 'agent',
              content: orchestrator.getDirectResponse(currentQuery),
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              agentName: mainAgent.name,
              agentPreset: mainAgent.preset,
              agentId: mainAgent.id,
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
          const defaultResponse: ChatMessage = {
            id: messages.length + 2,
            type: 'agent',
            content: '안녕하세요! 더 나은 도움을 위해 오른쪽에서 전문 에이전트를 선택해주세요.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentName: mainAgent.name,
            agentPreset: mainAgent.preset,
            agentId: mainAgent.id,
          };
          setMessages((prev) => [...prev, defaultResponse]);
        } else {
          const responses = activeAgents.map((agent, index) => ({
            id: messages.length + 2 + index,
            type: 'agent' as const,
            content: `[${agent.name}] ${orchestrator.getAgentResponse(agent, currentQuery)}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentName: agent.name,
            agentPreset: agent.preset,
            agentId: agent.id,
          }));

          setMessages((prev) => [...prev, ...responses]);
        }
      }, 1500);
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    const actionMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'user',
      content: `${action.label}: ${action.description}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, actionMessage]);
  };

  const handleAgentSelect = (agent: (typeof availableAgents)[0]) => {
    const newAgent: ActiveAgent = orchestrator.convertToActiveAgent(agent);

    if (activeAgents.some((a) => a.id === agent.id)) {
      return;
    }

    setActiveAgents((prev) => [...prev, newAgent]);

    const agentMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'system',
      content: `${agent.name}이 대화에 참여했습니다. ${orchestrationMode ? '오케스트레이터가 필요시 자동으로 배정할 예정입니다.' : agent.description}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, agentMessage]);
  };

  const handleRemoveAgent = (agentId: string) => {
    const agent = activeAgents.find((a) => a.id === agentId);
    if (!agent) return;

    setActiveAgents((prev) => prev.filter((a) => a.id !== agentId));
    setSelectedAgentForMenu(null);

    const leaveMessage: ChatMessage = {
      id: messages.length + 1,
      type: 'system',
      content: `${agent.name}이 대화에서 나갔습니다.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([...messages, leaveMessage]);
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'agent':
        return <Bot className="w-4 h-4" />;
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-500" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getReasoningStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'analysis':
        return <Search className="w-4 h-4 text-blue-500" />;
      case 'keyword-matching':
        return <Target className="w-4 h-4 text-green-500" />;
      case 'agent-selection':
        return <Users className="w-4 h-4 text-purple-500" />;
      case 'conclusion':
        return <Lightbulb className="w-4 h-4 text-orange-500" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  const getMessageBg = (type: string) => {
    switch (type) {
      case 'user':
        return 'bg-blue-50 border-blue-200';
      case 'agent':
        return 'bg-green-50 border-green-200';
      case 'reasoning':
        return 'bg-purple-50 border-purple-200';
      case 'system':
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-gray-50';
    }
  };

  const renderReasoningSteps = (steps: ReasoningStep[]) => {
    return (
      <div className="mt-4 space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.isCompleted ? 'bg-green-100' : 'bg-gray-100'
                }`}
              >
                {getReasoningStepIcon(step.type)}
              </div>
              {index < steps.length - 1 && <div className="w-0.5 h-4 bg-gray-300 mt-2"></div>}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium">{step.title}</h4>
                {step.isCompleted && <CheckCircle className="w-4 h-4 text-green-500" />}
              </div>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{step.content}</p>
              {step.data &&
                step.type === 'keyword-matching' &&
                Object.keys(step.data).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(step.data).map(([agentId, keywords]) => (
                      <Badge key={agentId} variant="secondary" className="text-xs">
                        {availableAgents.find((a) => a.id === agentId)?.name}
                      </Badge>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}
      </div>
    );
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
              {currentReasoningSteps.length > 0 && (
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
                  className={`relative w-8 h-8 p-0 ${orchestrator.getAgentColor(agent.id)} rounded-full flex items-center justify-center border-2 border-white hover:scale-110 transition-transform`}
                  style={{ zIndex: visibleAgents.length - index }}
                >
                  <span className="text-xs text-white">{agent.icon}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-0" align="start">
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${orchestrator.getAgentColor(agent.id)} rounded-full flex items-center justify-center`}
                    >
                      <span className="text-lg text-white">{agent.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.preset}</p>
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
                        className={`w-8 h-8 ${orchestrator.getAgentColor(agent.id)} rounded-full flex items-center justify-center flex-shrink-0`}
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
      <div className="flex flex-col">
        <div className="flex-1">
          <ChatHistory
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            selectedChatId={selectedChat?.id}
          />
        </div>

        {/* Quick Navigation */}
        <div className="border-t bg-white p-3">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">Quick Access</h4>
            <div className="grid grid-cols-2 gap-1">
              {quickNavItems.slice(0, 6).map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(item.id as AppModeState['activeSection'])}
                    className="h-8 text-xs justify-start gap-2 px-2"
                  >
                    <Icon className="w-3 h-3" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('settings')}
              className="w-full h-8 text-xs gap-2"
            >
              <Settings className="w-3 h-3" />
              Settings
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header with Orchestration Mode Toggle */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">
                  {selectedChat ? selectedChat.title : 'New Chat'}
                </h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {orchestrationMode ? (
                    <span>
                      🧠 Reasoning Mode • {activeAgents.length} specialist
                      {activeAgents.length > 1 ? 's' : ''} available
                    </span>
                  ) : (
                    <span>
                      {activeAgents.length} agent{activeAgents.length > 1 ? 's' : ''} active
                    </span>
                  )}
                </div>
              </div>

              {/* Agent Avatars */}
              {(orchestrationMode || activeAgents.length > 0) && (
                <div className="ml-6">{renderAgentAvatars()}</div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={orchestrationMode ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrchestrationMode(!orchestrationMode)}
              >
                <Brain className="w-4 h-4 mr-2" />
                {orchestrationMode ? 'Reasoning' : 'Direct Mode'}
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAgentPanel(!showAgentPanel)}
              >
                {showAgentPanel ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
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
                    {action.icon}
                    <span className="text-xs font-medium">{action.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className="space-y-2">
              <div
                className={`p-4 rounded-lg border ${getMessageBg(message.type)} max-w-4xl ${
                  message.type === 'user' ? 'ml-auto' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {message.type === 'agent' && message.agentId ? (
                      <div
                        className={`w-6 h-6 ${orchestrator.getAgentColor(message.agentId)} rounded-full flex items-center justify-center`}
                      >
                        <span className="text-xs text-white">
                          {message.agentId === mainAgent.id
                            ? mainAgent.icon
                            : availableAgents.find((a) => a.id === message.agentId)?.icon}
                        </span>
                      </div>
                    ) : (
                      getMessageIcon(message.type)
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium capitalize">
                        {message.type === 'agent' && message.agentName
                          ? message.agentName
                          : message.type === 'reasoning'
                            ? 'AgentOS (Reasoning)'
                            : message.type}
                      </span>
                      {message.agentPreset && (
                        <Badge variant="secondary" className="text-xs">
                          {message.agentPreset}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                    </div>
                    <p className="text-sm whitespace-pre-line">{message.content}</p>

                    {/* Reasoning Steps */}
                    {message.type === 'reasoning' &&
                      message.reasoningSteps &&
                      renderReasoningSteps(message.reasoningSteps)}
                  </div>
                </div>
              </div>

              {(message.type === 'agent' || message.type === 'reasoning') && (
                <div className="flex gap-2 ml-12">
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsUp className="w-3 h-3 mr-1" />
                    Good
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 px-2">
                    <ThumbsDown className="w-3 h-3 mr-1" />
                    Bad
                  </Button>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-3 text-muted-foreground">
              {orchestrationMode && currentReasoningSteps.length > 0 ? (
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
                {orchestrationMode && currentReasoningSteps.length > 0
                  ? 'AI reasoning in progress...'
                  : activeAgents.length > 0
                    ? `${activeAgents.length} agent${activeAgents.length > 1 ? 's' : ''} typing...`
                    : 'typing...'}
              </span>
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
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
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
        <div className="w-80 border-l bg-gray-50 flex flex-col">
          <div className="p-4 border-b bg-white">
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

          <div className="flex-1 p-4 space-y-3">
            {availableAgents.map((agent, index) => {
              const isActive = activeAgents.some((a) => a.id === agent.id);

              return (
                <Card
                  key={index}
                  className={`p-4 cursor-pointer transition-all ${
                    isActive ? 'border-green-500 bg-green-50' : 'hover:shadow-md'
                  }`}
                  onClick={() => handleAgentSelect(agent)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 ${isActive ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}
                    >
                      <span className="text-lg">{agent.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{agent.name}</h4>
                        <Badge
                          variant={
                            isActive
                              ? 'default'
                              : agent.status === 'active'
                                ? 'default'
                                : 'secondary'
                          }
                          className="text-xs"
                        >
                          {isActive ? 'Available' : agent.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{agent.preset}</p>
                      <p className="text-xs text-muted-foreground">{agent.description}</p>
                      {orchestrationMode && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {agent.keywords.slice(0, 3).map((keyword) => (
                            <span
                              key={keyword}
                              className="text-xs bg-blue-100 text-blue-700 px-1 py-0.5 rounded"
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

          <div className="p-4 border-t bg-white">
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
