import React from 'react';
import { Button } from '../ui/button';
import { MessageSquare, ArrowLeft } from 'lucide-react';

// Import new design hooks
import { useAppNavigation } from '../../hooks/useAppNavigation';
import { useChatState } from '../../hooks/useChatState';
import { useAppData } from '../../hooks/useAppData';
import { getPageTitle } from '../../utils/appUtils';

// Temporary imports for components that will be migrated in Phase 2
// TODO: These will be replaced with actual migrated components
import ChatView from '../chat/ChatView';
import ManagementView from '../management/ManagementView';
import Sidebar from '../management/Sidebar';

/**
 * New App Layout - 새 디자인 기반으로 완전히 재작성된 버전
 * 
 * 기존 AppLayout을 새 디자인의 App.tsx 구조로 대체
 * - ServiceContainer 기반 hooks 사용
 * - Core 타입과 완전 호환
 * - 듀얼 모드: Chat ↔ Management
 * - 새 디자인의 네비게이션 패턴 적용
 */
const NewAppLayout: React.FC = () => {
  const navigation = useAppNavigation();
  const chatState = useChatState();
  const appData = useAppData();

  const {
    activeSection,
    selectedPreset,
    creatingPreset,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,
    setActiveSection,
    handleBackToChat,
    handleSelectPreset,
    handleBackToPresets,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreatePreset,
    handleStartCreateMCPTool,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    isInDetailView,
  } = navigation;

  const {
    activeChatAgent,
    minimizedChats,
    handleOpenChat,
    handleCloseChat,
    handleMinimizeChat,
    handleRestoreChat,
  } = chatState;

  const {
    presets,
    currentAgents,
    showEmptyState,
    setShowEmptyState,
    handleUpdateAgentStatus,
    handleCreatePreset,
    handleCreateMCPTool,
    handleCreateAgent,
    handleCreateCustomTool,
    handleUpdatePreset,
    handleDeletePreset,
    getMentionableAgents,
    getActiveAgents,
  } = appData;

  // Create handlers that combine navigation and data operations
  const onCreatePreset = (newPreset: any) => {
    const preset = handleCreatePreset(newPreset);
    handleSelectPreset(preset);
    return preset;
  };

  const onCreateMCPTool = async (mcpConfig: any) => {
    const tool = await handleCreateMCPTool(mcpConfig);
    setActiveSection('tools');
    return tool;
  };

  const onCreateAgent = (newAgent: any) => {
    const agent = handleCreateAgent(newAgent);
    setActiveSection('subagents');
    return agent;
  };

  const onCreateCustomTool = (toolData: any) => {
    const tool = handleCreateCustomTool(toolData);
    setActiveSection('toolbuilder');
    return tool;
  };

  const onUpdatePreset = async (updatedPreset: any) => {
    await handleUpdatePreset(updatedPreset);
    if (selectedPreset?.id === updatedPreset.id) {
      handleSelectPreset({ ...updatedPreset, updatedAt: new Date() });
    }
  };

  const onDeletePreset = async (presetId: string) => {
    await handleDeletePreset(presetId);
    if (selectedPreset?.id === presetId) {
      handleBackToPresets();
    }
  };

  const pageTitle = getPageTitle(
    creatingPreset,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,
    selectedPreset,
    activeSection
  );

  // Chat Mode: Full screen ChatView with integrated ChatHistory sidebar
  if (activeSection === 'chat') {
    if (currentAgents.length === 0) {
      return (
        <div className="h-screen bg-background flex items-center justify-center">
          <div className="max-w-lg">
            {/* TODO: Replace with actual EmptyState component in Phase 2 */}
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to AgentOS</h2>
              <p className="text-muted-foreground mb-6">
                To start chatting, you'll need to create at least one AI agent. 
                Agents are your AI-powered assistants that can help with various tasks.
              </p>
              <Button 
                onClick={() => setActiveSection('subagents')}
                className="mr-4"
              >
                Create First Agent
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setActiveSection('dashboard')}
              >
                Explore Features
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // TODO: Replace with new design ChatView in Phase 2
    return (
      <div className="h-screen bg-background">
        <ChatView 
          onNavigate={setActiveSection}
          // Pass agents and mentionable agents when ChatView is updated
        />
      </div>
    );
  }

  // Management Mode: Traditional sidebar + content layout
  return (
    <div className="flex h-screen bg-background">
      {/* ✅ New design Sidebar - migrated in TODO 5/12 */}
      {!isInDetailView() && (
        <Sidebar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      )}
      
      <main className="flex-1 overflow-hidden flex flex-col">
        {!isInDetailView() && (
          <div className="border-b bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToChat}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Chat
                </Button>
                <div className="w-px h-6 bg-border"></div>
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBackToChat}
                  className="gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Open Chat
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEmptyState(!showEmptyState)}
                  className="gap-2"
                >
                  {showEmptyState ? 'Show Agents' : 'Demo Empty State'}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {/* TODO: Replace with new design components in Phase 2 */}
          <ManagementView
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            onBackToChat={handleBackToChat}
            onOpenChat={(agentId, agentName, agentPreset) => {
              // Convert to DesignAgent format for new hooks
              const agent = {
                id: (agentId ?? 'unknown').toString(),
                name: agentName ?? 'Unknown Agent',
                preset: agentPreset ?? 'default',
                description: '',
                category: 'general',
                status: 'active' as const,
                usageCount: 0,
              };
              handleOpenChat(agent);
            }}
          />
        </div>
      </main>

      {/* Chat Interface (floating) */}
      {activeChatAgent && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* TODO: Replace with new design ChatInterface in Phase 2 */}
          <div className="bg-card border rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{activeChatAgent.name}</span>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={handleMinimizeChat}>
                  -
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCloseChat}>
                  ×
                </Button>
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Preset: {activeChatAgent.preset}
            </div>
          </div>
        </div>
      )}

      {/* Minimized Chats */}
      {minimizedChats.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex gap-2">
          {minimizedChats.map((chat) => (
            <Button
              key={chat.id}
              onClick={() => handleRestoreChat(chat)}
              className="h-12 px-3 text-sm font-medium"
              variant="secondary"
            >
              {chat.name.split(' ')[0]}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewAppLayout;