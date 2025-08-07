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
  // State management
  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [orchestrationMode, setOrchestrationMode] = useState(true);
  const [multiAgentSessions, setMultiAgentSessions] = useState<Record<string, Agent[]>>({});
  const [agentMessages, setAgentMessages] = useState<Record<string, MessageHistory[]>>({});
  const [expandedOrchestrations, setExpandedOrchestrations] = useState<Record<string, boolean>>({});

  // Services - Refactored to use actual services instead of mocks
  const [chatSessions, setChatSessions] = useState<ChatSessionMetadata[]>([]);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const chatService = ServiceContainer.get<ChatService>('chat');

  // Load data on component mount - Refactored from mock services
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        // Load chat sessions from actual service instead of mock
        const sessions = await chatService.listSessions();
        setChatSessions(sessions);
        
        // TODO: Load available agents from actual agent service when available
        // For now, provide empty array to maintain functionality
        setAvailableAgents([]);
      } catch (error) {
        console.error('Failed to load chat data:', error);
        // Graceful fallback - maintain empty arrays
        setChatSessions([]);
        setAvailableAgents([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [chatService]);

  const quickActions: QuickAction[] = [
    {
      id: 'analyze',
      label: 'Analyze Document',
      icon: FileText,
      description: 'Upload and analyze documents',
      category: 'chat',
    },
    {
      id: 'code-review',
      label: 'Code Review',
      icon: Code,
      description: 'Review code for issues',
      category: 'chat',
    },
    {
      id: 'data-viz',
      label: 'Data Visualization',
      icon: BarChart3,
      description: 'Create charts and graphs',
      category: 'chat',
    },
    {
      id: 'brainstorm',
      label: 'Brainstorm Ideas',
      icon: Brain,
      description: 'Generate creative solutions',
      category: 'chat',
    },
  ];

  const handleNewChat = async () => {
    try {
      const newSession = await chatService.createSession();
      setChatSessions(prev => [newSession, ...prev]);
      setCurrentChatId(newSession.sessionId);
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleSelectChat = async (chat: ChatSessionMetadata) => {
    try {
      setCurrentChatId(chat.sessionId);
      // Load messages for selected chat
      const messages = await chatService.getMessages(chat.sessionId);
      // Update message state as needed
    } catch (error) {
      console.error('Failed to select chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentChatId) return;

    try {
      setIsLoading(true);
      await chatService.sendMessage(currentChatId, inputMessage);
      setInputMessage('');
      // Refresh messages if needed
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAgent = (agentId: string) => {
    // Remove agent from current orchestration
    if (currentChatId) {
      setMultiAgentSessions(prev => ({
        ...prev,
        [currentChatId]: prev[currentChatId]?.filter(agent => agent.id !== agentId) || [],
      }));
    }
  };

  const handleQuickAction = (action: QuickAction) => {
    // Handle quick action implementation
    console.log('Quick action:', action.id);
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div
        className={`${
          sidebarCollapsed ? 'w-0' : 'w-80'
        } transition-all duration-300 border-r border-gray-200 flex flex-col bg-gray-50`}
      >
        {!sidebarCollapsed && (
          <ChatHistory
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            selectedChatId={currentChatId}
            onNavigate={onNavigate}
          />
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-800">
                {currentChatId ? `Chat ${currentChatId.slice(0, 8)}` : 'New Chat'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orchestration Mode Toggle */}
            <Button
              variant={orchestrationMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setOrchestrationMode(!orchestrationMode)}
              className="gap-2"
            >
              <Bot className="w-4 h-4" />
              Multi-Agent
            </Button>
            
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading && (
            <div className="text-center text-gray-500">Loading...</div>
          )}
          
          {chatSessions.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold mb-2">No chats yet</h3>
              <p className="text-sm mb-4">Start a conversation or try a quick action</p>
              
              {/* Quick Actions Grid */}
              <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    className="h-auto p-4 flex flex-col items-center gap-2"
                    onClick={() => handleQuickAction(action)}
                  >
                    <action.icon className="w-6 h-6 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{action.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{action.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Agent Orchestration Panel */}
          {orchestrationMode && availableAgents.length > 0 && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-blue-800">Multi-Agent Collaboration</span>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {multiAgentSessions[currentChatId]?.length || 0} agents
                </Badge>
              </div>

              {/* Agent Selection */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                {availableAgents.slice(0, 4).map((agent) => (
                  <div key={agent.id} className="p-2 bg-white rounded border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium text-sm">{agent.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAgent(agent.id)}
                      >
                        <UserMinus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{agent.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="flex items-end gap-3">
            <Button variant="outline" size="sm">
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="resize-none"
              />
            </div>

            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatView;