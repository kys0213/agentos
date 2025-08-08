import { Sidebar } from "./components/Sidebar";
import { ChatView } from "./components/ChatView";
import { Dashboard } from "./components/Dashboard";
import { PresetList } from "./components/PresetList";
import { PresetDetail } from "./components/PresetDetail";
import { PresetCreate } from "./components/PresetCreate";
import { MCPToolCreate } from "./components/MCPToolCreate";
import { AgentCreate } from "./components/AgentCreate";
import { SubAgentManager } from "./components/SubAgentManager";
import { ModelManager } from "./components/ModelManager";
import { MCPToolsManager } from "./components/MCPToolsManager";
import { SettingsManager } from "./components/SettingsManager";
import { RACPManager } from "./components/RACPManager";
import { ToolBuilder } from "./components/ToolBuilder";
import { ToolBuilderCreate } from "./components/ToolBuilderCreate";
import { ChatInterface } from "./components/ChatInterface";
import { EmptyState } from "./components/EmptyState";
import { Button } from "./components/ui/button";
import { MessageSquare, ArrowLeft } from "lucide-react";

import { useAppNavigation } from "./hooks/useAppNavigation";
import { useChatState } from "./hooks/useChatState";
import { useAppData } from "./hooks/useAppData";
import { getPageTitle } from "./utils/appUtils";

export default function App() {
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
    isInDetailView
  } = navigation;

  const {
    activeChatAgent,
    minimizedChats,
    handleOpenChat,
    handleCloseChat,
    handleMinimizeChat,
    handleRestoreChat
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
    getActiveAgents
  } = appData;

  // Create handlers that combine navigation and data operations
  const onCreatePreset = (newPreset: any) => {
    const preset = handleCreatePreset(newPreset);
    setCreatingPreset(false);
    setSelectedPreset(preset);
    return preset;
  };

  const onCreateMCPTool = (mcpConfig: any) => {
    const tool = handleCreateMCPTool(mcpConfig);
    setCreatingMCPTool(false);
    setActiveSection("tools");
    return tool;
  };

  const onCreateAgent = (newAgent: any) => {
    const agent = handleCreateAgent(newAgent);
    setCreatingAgent(false);
    setActiveSection("subagents");
    return agent;
  };

  const onCreateCustomTool = (toolData: any) => {
    const tool = handleCreateCustomTool(toolData);
    setCreatingCustomTool(false);
    setActiveSection("toolbuilder");
    return tool;
  };

  const onUpdatePreset = (updatedPreset: any) => {
    handleUpdatePreset(updatedPreset);
    if (selectedPreset?.id === updatedPreset.id) {
      setSelectedPreset({ ...updatedPreset, updatedAt: new Date() });
    }
  };

  const onDeletePreset = (presetId: string) => {
    handleDeletePreset(presetId);
    if (selectedPreset?.id === presetId) {
      setSelectedPreset(null);
    }
  };

  const renderManagementContent = () => {
    if (creatingPreset) {
      return <PresetCreate onBack={handleBackToPresets} onCreate={onCreatePreset} />;
    }

    if (creatingMCPTool) {
      return <MCPToolCreate onBack={handleBackToTools} onCreate={onCreateMCPTool} />;
    }

    if (creatingAgent) {
      return <AgentCreate onBack={handleBackToAgents} onCreate={onCreateAgent} presets={presets} />;
    }

    if (creatingCustomTool) {
      return <ToolBuilderCreate onBack={handleBackToToolBuilder} onCreate={onCreateCustomTool} />;
    }

    if (selectedPreset) {
      return (
        <PresetDetail 
          preset={selectedPreset} 
          onBack={handleBackToPresets}
          onUpdate={onUpdatePreset}
          onDelete={onDeletePreset}
        />
      );
    }

    switch (activeSection) {
      case "dashboard":
        return <Dashboard onOpenChat={handleOpenChat} />;
      case "presets":
        return (
          <PresetList 
            presets={presets}
            onSelectPreset={handleSelectPreset}
            onCreatePreset={handleStartCreatePreset}
          />
        );
      case "subagents":
        if (currentAgents.length === 0) {
          return (
            <div className="p-6 h-full flex items-center justify-center">
              <div className="max-w-md">
                <EmptyState
                  type="agents"
                  title="No Agents Yet"
                  description="Create your first AI agent to start automating tasks and having intelligent conversations. Agents can be specialized for research, coding, content creation, and more."
                  actionLabel="Create First Agent"
                  onAction={handleStartCreateAgent}
                  secondaryAction={{
                    label: "View Templates",
                    onClick: () => console.log("Show agent templates")
                  }}
                />
              </div>
            </div>
          );
        }
        return (
          <SubAgentManager 
            agents={currentAgents}
            onUpdateAgentStatus={handleUpdateAgentStatus}
            onOpenChat={handleOpenChat}
            onCreateAgent={handleStartCreateAgent}
          />
        );
      case "models":
        return <ModelManager />;
      case "tools":
        return <MCPToolsManager onCreateTool={handleStartCreateMCPTool} />;
      case "toolbuilder":
        return <ToolBuilder onCreateTool={handleStartCreateCustomTool} />;
      case "racp":
        return <RACPManager />;
      case "settings":
        return <SettingsManager />;
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

  // Chat Mode: Full screen ChatView with integrated ChatHistory sidebar
  if (activeSection === "chat") {
    if (currentAgents.length === 0) {
      return (
        <div className="h-screen bg-background flex items-center justify-center">
          <div className="max-w-lg">
            <EmptyState
              type="chat"
              title="Welcome to AgentOS"
              description="To start chatting, you'll need to create at least one AI agent. Agents are your AI-powered assistants that can help with various tasks."
              actionLabel="Create First Agent"
              onAction={() => setActiveSection("subagents")}
              secondaryAction={{
                label: "Explore Features",
                onClick: () => setActiveSection("dashboard")
              }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen bg-background">
        <ChatView 
          onNavigate={setActiveSection}
          agents={currentAgents}
          mentionableAgents={getMentionableAgents()}
          activeAgents={getActiveAgents()}
        />
      </div>
    );
  }

  // Management Mode: Traditional sidebar + content layout
  return (
    <div className="flex h-screen bg-background">
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
                  {showEmptyState ? "Show Agents" : "Demo Empty State"}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {renderManagementContent()}
        </div>
      </main>

      {activeChatAgent && (
        <div className="fixed bottom-4 right-4 z-50">
          <ChatInterface
            agentId={activeChatAgent.id}
            agentName={activeChatAgent.name}
            agentPreset={activeChatAgent.preset}
            onClose={handleCloseChat}
            onMinimize={handleMinimizeChat}
          />
        </div>
      )}

      {minimizedChats.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex gap-2">
          {minimizedChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleRestoreChat(chat)}
              className="status-idle px-3 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {chat.name.split(" ")[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}