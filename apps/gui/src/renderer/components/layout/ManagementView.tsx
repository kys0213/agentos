import {
  ArrowLeft,
  MessageSquare,
  Minimize2,
  X,
  Bot,
  CheckCircle,
  Clock,
  MinusCircle,
} from 'lucide-react';
import React from 'react';
import { Dashboard } from '../dashboard/Dashboard';
import ModelManagerContainer from '../llm/ModelManagerContainer';
import { MCPToolsManager } from '../mcp/McpToolManager';
import SubAgentManagerContainer from '../sub-agent/SubAgentManagerContainer';
import { ToolBuilder } from '../tool/ToolBuilder';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
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
import { useQueryClient } from '@tanstack/react-query';
import { usePresets } from '../../hooks/queries/use-presets';

interface ManagementViewProps {
  navigation: UseAppNavigationReturn;
}

/**
 * 관리 화면 - design/App.tsx 패턴을 따라 navigation을 직접 관리
 */
const ManagementView: React.FC<ManagementViewProps> = ({ navigation }) => {
  const queryClient = useQueryClient();
  // Use hooks directly like design/App.tsx
  const chatState = useChatState();
  const appData = useAppData();
  const { data: presetsData = [], isLoading: presetsLoading } = usePresets();

  const {
    activeSection,
    creatingMCPTool,
    creatingAgent,
    creatingCustomTool,
    agentCreationStep,
    mcpCreationStep,
    customToolCreationStep,
    setActiveSection,
    handleBackToChat,
    handleBackToTools,
    handleBackToAgents,
    handleBackToToolBuilder,
    handleStartCreateMCPTool,
    handleStartCreateAgent,
    handleStartCreateCustomTool,
    setAgentCreationStep,
    setMcpCreationStep,
    setCustomToolCreationStep,
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
    mentionableAgents,
    activeAgents,
    showEmptyState,
    setShowEmptyState,
    handleCreateMCPTool,
    handleCreateCustomTool,
    reloadAgents,
    loading: agentsLoading,
  } = appData;

  const onCreateMCPTool = async (mcpConfig: McpConfig) => {
    const tool = await handleCreateMCPTool(mcpConfig);
    handleBackToTools();
    setActiveSection('tools');
    setMcpCreationStep('overview');
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
    return tool;
  };

  const onCreateCustomTool = (toolData: unknown) => {
    const tool = handleCreateCustomTool(toolData);
    handleBackToToolBuilder();
    setActiveSection('toolbuilder');
    setCustomToolCreationStep('describe');
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

  const handleNavigateToTools = () => {
    handleBackToTools();
    setActiveSection('tools');
  };

  const handleRegisterTool = () => {
    setActiveSection('tools');
    handleStartCreateMCPTool('overview');
  };

  const resolveCreationView = (): React.ReactNode => {
    if (creatingMCPTool) {
      return (
        <MCPToolCreate
          onBack={() => {
            handleBackToTools();
            setMcpCreationStep('overview');
          }}
          onCreate={onCreateMCPTool}
          currentStepId={mcpCreationStep}
          onStepChange={setMcpCreationStep}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard', 'activity'] });
          }}
        />
      );
    }

    if (creatingAgent) {
      return (
        <SubAgentCreateContainer
          onBack={() => {
            handleBackToAgents();
            setAgentCreationStep('overview');
          }}
          onCreated={(id) => {
            handleOpenChat(id);
            setAgentCreationStep('overview');
          }}
          currentStepId={agentCreationStep}
          onStepChange={setAgentCreationStep}
        />
      );
    }

    if (creatingCustomTool) {
      return (
        <ToolBuilderCreate
          onBack={() => {
            handleBackToToolBuilder();
            setCustomToolCreationStep('describe');
          }}
          onCreate={onCreateCustomTool}
          currentStepId={customToolCreationStep}
          onStepChange={setCustomToolCreationStep}
        />
      );
    }

    return null;
  };

  const resolveSectionView = (): React.ReactNode => {
    switch (activeSection) {
      case 'chat':
        handleBackToChat();
        return null;
      case 'dashboard':
        return (
          <Dashboard
            onOpenChat={handleOpenChat}
            presets={dashboardPresets}
            currentAgents={currentAgents}
            mentionableAgents={mentionableAgents}
            activeAgents={activeAgents}
            loading={dashboardLoading}
            onCreateAgent={handleStartCreateAgent}
            onManageTools={handleNavigateToTools}
            onRegisterTool={handleRegisterTool}
          />
        );
      case 'subagents':
        return (
          <SubAgentManagerContainer
            onCreateAgent={handleStartCreateAgent}
            forceEmptyState={showEmptyState}
            onToggleEmptyState={() => setShowEmptyState(!showEmptyState)}
          />
        );
      case 'models':
        return (
          <div className="space-y-6">
            <ModelManagerContainer reloadAgents={reloadAgents} />
          </div>
        );
      case 'tools':
        return (
          <MCPToolsManager
            onCreateTool={handleStartCreateMCPTool}
            forceEmptyState={showEmptyState}
            onToggleEmptyState={() => setShowEmptyState(!showEmptyState)}
          />
        );
      case 'toolbuilder':
        return (
          <ToolBuilder
            onCreateTool={handleStartCreateCustomTool}
            forceEmptyState={showEmptyState}
            onToggleEmptyState={() => setShowEmptyState(!showEmptyState)}
          />
        );
      case 'racp':
        return <RACPManager />;
      case 'settings':
        return <SettingsManager />;
      default:
        return null;
    }
  };

  const renderManagementContent = () => {
    const creationView = resolveCreationView();
    if (creationView) {
      return creationView;
    }
    return resolveSectionView();
  };

  const pageTitle = getPageTitle(creatingMCPTool, creatingAgent, creatingCustomTool, activeSection);
  const dashboardLoading = agentsLoading || appData.loading || presetsLoading;
  const dashboardPresets = presetsData as Preset[];

  const renderStatusBadge = (status: string | undefined) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="text-[11px] gap-1 status-active-subtle">
            <CheckCircle className="w-3 h-3" /> Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="text-[11px] gap-1 status-idle-subtle">
            <Clock className="w-3 h-3" /> Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="text-[11px] gap-1 status-inactive-subtle">
            <MinusCircle className="w-3 h-3" /> Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const canToggleEmptyState =
    activeSection === 'subagents' || activeSection === 'tools' || activeSection === 'toolbuilder';

  const emptyStateButtonLabel = (() => {
    if (!canToggleEmptyState) {
      return showEmptyState ? 'Show Content' : 'Demo Empty State';
    }

    if (!showEmptyState) {
      return 'Demo Empty State';
    }

    if (activeSection === 'subagents') {
      return 'Show Agents';
    }

    if (activeSection === 'tools' || activeSection === 'toolbuilder') {
      return 'Show Tools';
    }

    return 'Show Content';
  })();

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - only show when not in detail view */}
      {!isInDetailView() && (
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header - only show when not in detail view */}
        {!isInDetailView() && (
          <div className="border-b bg-card p-4">
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

                {canToggleEmptyState && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowEmptyState(!showEmptyState)}
                    className="gap-2"
                  >
                    {emptyStateButtonLabel}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Management Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto">{renderManagementContent()}</div>
        </div>
      </main>

      {/* Floating Chat Interface */}
      {activeChatAgent && (
        <div className="fixed bottom-4 right-4 z-50 w-[360px]">
          <Card className="shadow-xl border bg-card">
            <div className="flex items-start justify-between p-4 border-b">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {activeChatAgent.name}
                    </span>
                    {renderStatusBadge(activeChatAgent.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">{activeChatAgent.preset.name}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMinimizeChat}
                  className="w-8 h-8 p-0"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseChat}
                  className="w-8 h-8 p-0"
                  aria-label="Close chat"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="p-4 space-y-3 text-sm text-muted-foreground">
              <p>
                Continue chatting with{' '}
                <span className="font-medium text-foreground">{activeChatAgent.name}</span>. Open
                the main chat view to see conversation history and respond.
              </p>
              {activeChatAgent.lastUsed && (
                <p className="text-xs">
                  Last active:{' '}
                  {typeof activeChatAgent.lastUsed === 'string'
                    ? new Date(activeChatAgent.lastUsed).toLocaleString()
                    : activeChatAgent.lastUsed.toLocaleString()}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t p-4">
              <Button variant="ghost" size="sm" className="gap-2" onClick={handleMinimizeChat}>
                <Minimize2 className="w-4 h-4" />
                Minimize
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  handleOpenChat(activeChatAgent.id);
                  handleBackToChat();
                }}
              >
                <MessageSquare className="w-4 h-4" />
                Open Chat
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Minimized Chats */}
      {minimizedChats.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex gap-2">
          {minimizedChats.map((chat) => (
            <Button
              key={chat.id}
              onClick={() => handleRestoreChat(chat)}
              className="h-10 px-3 text-xs font-medium border-dashed"
              variant="outline"
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
