import React from 'react';
import Sidebar from './Sidebar';
import { Button } from '../ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Dashboard } from '../dashboard/Dashboard';
import { PresetManager } from '../preset/PresetManager';
import { SubAgentManager } from '../sub-agent/SubAgentManager';
import { ModelManager } from '../model/ModelManager';
import { MCPToolsManager } from '../mcp/McpToolManager';
import { ToolBuilder } from '../tool/ToolBuilder';

// Import new design hooks like design/App.tsx
import { useChatState } from '../../hooks/useChatState';
import { useAppData } from '../../hooks/useAppData';
import { getPageTitle } from '../../utils/appUtils';
import { UseAppNavigationReturn } from '../../types/design-types';
import { AgentMetadata } from '@agentos/core';

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
    handleOpenChat: handleOpenChatFromHook,
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

  // Create handlers that combine navigation and data operations (like design/App.tsx)
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
    if (creatingPreset) {
      return (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleBackToPresets} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Presets
              </Button>
              <h1 className="text-2xl font-semibold">Create New Preset</h1>
            </div>
            {/* TODO: Replace with actual PresetCreate component when available */}
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground">Preset creation form coming soon...</p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() =>
                    onCreatePreset({ name: 'New Preset', description: 'Created preset' })
                  }
                >
                  Create Sample Preset
                </Button>
                <Button variant="outline" onClick={handleBackToPresets}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (creatingMCPTool) {
      return (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleBackToTools} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Tools
              </Button>
              <h1 className="text-2xl font-semibold">Add MCP Tool</h1>
            </div>
            {/* TODO: Replace with actual MCPToolCreate component when available */}
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground">MCP tool creation form coming soon...</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => onCreateMCPTool({ name: 'New Tool', type: 'mcp' })}>
                  Create Sample Tool
                </Button>
                <Button variant="outline" onClick={handleBackToTools}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (creatingAgent) {
      return (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleBackToAgents} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Agents
              </Button>
              <h1 className="text-2xl font-semibold">Create New Agent</h1>
            </div>
            {/* TODO: Replace with actual AgentCreate component when available */}
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground">Agent creation form coming soon...</p>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => onCreateAgent({ name: 'New Agent', description: 'Created agent' })}
                >
                  Create Sample Agent
                </Button>
                <Button variant="outline" onClick={handleBackToAgents}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (creatingCustomTool) {
      return (
        <div className="p-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToToolBuilder}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tool Builder
              </Button>
              <h1 className="text-2xl font-semibold">Create Custom Tool</h1>
            </div>
            {/* TODO: Replace with actual ToolBuilderCreate component when available */}
            <div className="bg-card border rounded-lg p-6">
              <p className="text-muted-foreground">Custom tool creation form coming soon...</p>
              <div className="flex gap-2 mt-4">
                <Button onClick={() => onCreateCustomTool({ name: 'New Custom Tool' })}>
                  Create Sample Tool
                </Button>
                <Button variant="outline" onClick={handleBackToToolBuilder}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle preset detail view
    if (selectedPreset) {
      return (
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button variant="outline" size="sm" onClick={handleBackToPresets} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Presets
              </Button>
              <h1 className="text-2xl font-semibold">{selectedPreset.name}</h1>
            </div>
            {/* TODO: Replace with actual PresetDetail component when available */}
            <div className="bg-card border rounded-lg p-6">
              <h3 className="text-lg font-medium mb-2">{selectedPreset.name}</h3>
              <p className="text-muted-foreground mb-4">{selectedPreset.description}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() =>
                    onUpdatePreset({ ...selectedPreset, name: selectedPreset.name + ' (Updated)' })
                  }
                >
                  Update Preset
                </Button>
                <Button variant="destructive" onClick={() => onDeletePreset(selectedPreset.id)}>
                  Delete Preset
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Handle main section routing (like design/App.tsx)
    switch (activeSection) {
      case 'chat':
        // Should not happen in ManagementView, but redirect if it does
        handleBackToChat();
        return null;
      case 'dashboard':
        return <Dashboard onOpenChat={handleOpenChat} />;
      case 'presets':
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Preset Manager</h1>
              <Button onClick={handleStartCreatePreset}>Create Preset</Button>
            </div>
            <PresetManager />
          </div>
        );
      case 'subagents':
        if (currentAgents.length === 0 && !showEmptyState) {
          return (
            <div className="p-6 h-full flex items-center justify-center">
              <div className="max-w-md text-center">
                <h2 className="text-2xl font-bold mb-4">No Agents Yet</h2>
                <p className="text-muted-foreground mb-6">
                  Create your first AI agent to start automating tasks and having intelligent
                  conversations. Agents can be specialized for research, coding, content creation,
                  and more.
                </p>
                <Button onClick={handleStartCreateAgent} className="mr-4">
                  Create First Agent
                </Button>
                <Button variant="outline" onClick={() => setShowEmptyState(true)}>
                  Show Sample Agents
                </Button>
              </div>
            </div>
          );
        }
        return (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-semibold">Sub-Agent Manager</h1>
              <Button onClick={handleStartCreateAgent}>Create Agent</Button>
            </div>
            <SubAgentManager onOpenChat={handleOpenChat} />
          </div>
        );
      case 'models':
        return <ModelManager />;
      case 'tools':
        return (
          <div>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">MCP Tools</h1>
                <Button onClick={handleStartCreateMCPTool}>Add Tool</Button>
              </div>
            </div>
            <MCPToolsManager />
          </div>
        );
      case 'toolbuilder':
        return (
          <div>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Tool Builder</h1>
                <Button onClick={handleStartCreateCustomTool}>Create Tool</Button>
              </div>
            </div>
            <ToolBuilder onCreateTool={handleStartCreateCustomTool} />
          </div>
        );
      case 'racp':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">RACP Manager</h1>
            <p className="text-muted-foreground">
              Remote Agent Call Protocol settings coming soon...
            </p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground">Application settings coming soon...</p>
          </div>
        );
      default:
        return null;
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

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - only show when not in detail view */}
      {!isInDetailView() && (
        <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      )}

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Header - only show when not in detail view */}
        {!isInDetailView() && (
          <div className="border-b bg-white p-4">
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

        {/* Management Content */}
        <div className="flex-1 overflow-hidden">{renderManagementContent()}</div>
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
