import { ArrowLeft, MessageSquare } from 'lucide-react';
import React from 'react';
import { Dashboard } from '../dashboard/Dashboard';
import ModelManagerContainer from '../llm/ModelManagerContainer';
import { MCPToolsManager } from '../mcp/McpToolManager';
import SubAgentManagerContainer from '../sub-agent/SubAgentManagerContainer';
import { ToolBuilder } from '../tool/ToolBuilder';
import { Button } from '../ui/button';
import Sidebar from './Sidebar';

// Import new design hooks like design/App.tsx
import type { McpConfig, Preset } from '@agentos/core';
import { useAppData } from '../../hooks/useAppData';
import { useChatState } from '../../hooks/useChatState';
import { UseAppNavigationReturn } from '../../stores/store-types';
import { getPageTitle } from '../../utils/appUtils';
import { MCPToolCreate } from '../mcp/MCPToolCreate';
import { RACPManager } from '../racp/RACPManager';
import { SettingsManager } from '../settings/SettingManager';
import SubAgentCreateContainer from '../sub-agent/SubAgentCreateContainer';
import { ToolBuilderCreate } from '../tool/ToolBuilderCreate';

interface ManagementViewProps {
  navigation: UseAppNavigationReturn;
}

/**
 * 관리 화면 - design/App.tsx 패턴을 따라 navigation을 직접 관리
 */
const ManagementView: React.FC<ManagementViewProps> = ({ navigation }) => {
  // Use hooks directly like design/App.tsx
  const chatState = useChatState();
  const appData = useAppData();
  const emptyPresets: Preset[] = [];

  const {
    activeSection,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,
    setActiveSection,
    handleBackToChat,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    isInDetailView,
  } = navigation;

  const {
    activeChatAgent,
    minimizedChats,
    handleOpenChat: handleOpenChatFromHook,
    handleCloseChat,
    handleMinimizeChat,
    handleRestoreChat,
  } = chatState;

  const {
    currentAgents,
    showEmptyState,
    setShowEmptyState,
    handleCreateMCPTool,
    handleCreateCustomTool,
    reloadAgents,
  } = appData;

  const onCreateMCPTool = async (mcpConfig: McpConfig) => {
    const tool = await handleCreateMCPTool(mcpConfig);
    setActiveSection('tools');
    return tool;
  };

  const onCreateCustomTool = (toolData: unknown) => {
    const tool = handleCreateCustomTool(toolData);
    setActiveSection('toolbuilder');
    return tool;
  };

  const handleOpenChat = (agentId: string) => {
    // Convert to DesignAgent format for new hooks (like NewAppLayout)

    const agent = currentAgents.find((agent) => agent.id === agentId);

    if (agent) {
      handleOpenChatFromHook(agent);
    }

    handleBackToChat();
  };

  const renderManagementContent = () => {
    // Handle creation modes first (like design/App.tsx)
    if (creatingMCPTool) {
      return <MCPToolCreate onBack={handleBackToTools} onCreate={onCreateMCPTool} />;
    }

    if (creatingAgent) {
      return (
        <SubAgentCreateContainer
          onBack={handleBackToAgents}
          onCreated={(id) => {
            // Open chat with the newly created agent and return to chat view
            handleOpenChat(id);
          }}
        />
      );
    }

    if (creatingCustomTool) {
      return <ToolBuilderCreate onBack={handleBackToToolBuilder} onCreate={onCreateCustomTool} />;
    }

    // Handle main section routing (like design/App.tsx)
    switch (activeSection) {
      case 'chat':
        // Should not happen in ManagementView, but redirect if it does
        handleBackToChat();
        return null;
      case 'dashboard':
        return (
          <Dashboard
            onOpenChat={handleOpenChat}
            presets={emptyPresets}
            currentAgents={currentAgents}
            loading={false}
            onCreateAgent={handleStartCreateAgent}
          />
        );
      case 'subagents':
        // Always render the React Query–backed container; it handles loading/empty states
        return <SubAgentManagerContainer onCreateAgent={handleStartCreateAgent} />;
      case 'models':
        return (
          <div className="space-y-6">
            <ModelManagerContainer reloadAgents={reloadAgents} />
          </div>
        );
      case 'tools':
        return <MCPToolsManager />;
      case 'toolbuilder':
        return <ToolBuilder onCreateTool={handleStartCreateCustomTool} />;
      case 'racp':
        return <RACPManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return null;
    }
  };

  const pageTitle = getPageTitle(creatingMCPTool, creatingAgent, creatingCustomTool, activeSection);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - only show when not in detail view */}
      {!isInDetailView() && (
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header - only show when not in detail view */}
        {!isInDetailView() && (
          <div className="border-b bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={handleBackToChat} className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Chat
                </Button>
                <div className="w-px h-6 bg-border"></div>
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleBackToChat} className="gap-2">
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

        {/* Management Content: make this area scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto">{renderManagementContent()}</div>
      </main>

      {/* Floating Chat Interface (like design/App.tsx) */}
      {activeChatAgent && (
        <div className="fixed bottom-4 right-4 z-50">
          {/* TODO: Replace with actual ChatInterface component when available */}
          <div className="bg-card border rounded-lg shadow-lg p-4 min-w-80">
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
            <div className="text-sm text-muted-foreground mb-2">
              Preset: {activeChatAgent.preset.name}
            </div>
            <div className="border rounded p-2 bg-background">
              <p className="text-sm text-muted-foreground">Chat interface coming soon...</p>
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

export default ManagementView;
