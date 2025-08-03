import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatView } from './components/ChatView';
import { Dashboard } from './components/Dashboard';
import { PresetManager } from './components/PresetManager';
import { SubAgentManager } from './components/SubAgentManager';
import { ModelManager } from './components/ModelManager';
import { ChatInterface } from './components/ChatInterface';
import { Button } from './components/ui/button';
import { MessageSquare, ArrowLeft } from 'lucide-react';

export default function App() {
  const [activeSection, setActiveSection] = useState('chat');
  const [activeChatAgent, setActiveChatAgent] = useState<{
    id: number;
    name: string;
    preset: string;
  } | null>(null);
  const [minimizedChats, setMinimizedChats] = useState<
    Array<{
      id: number;
      name: string;
      preset: string;
    }>
  >([]);

  const handleOpenChat = (agentId: number, agentName: string, agentPreset: string) => {
    setActiveChatAgent({
      id: agentId,
      name: agentName,
      preset: agentPreset,
    });
  };

  const handleCloseChat = () => {
    setActiveChatAgent(null);
  };

  const handleMinimizeChat = () => {
    if (activeChatAgent) {
      setMinimizedChats((prev) => [...prev, activeChatAgent]);
      setActiveChatAgent(null);
    }
  };

  const handleRestoreChat = (chat: { id: number; name: string; preset: string }) => {
    setActiveChatAgent(chat);
    setMinimizedChats((prev) => prev.filter((c) => c.id !== chat.id));
  };

  const handleBackToChat = () => {
    setActiveSection('chat');
  };

  const renderManagementContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onOpenChat={handleOpenChat} />;
      case 'presets':
        return <PresetManager />;
      case 'subagents':
        return <SubAgentManager onOpenChat={handleOpenChat} />;
      case 'models':
        return <ModelManager />;
      case 'tools':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">MCP Tools</h1>
            <p className="text-muted-foreground">Tool management coming soon...</p>
          </div>
        );
      case 'racp':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">RACP</h1>
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

  // Chat Mode: Full screen ChatView with integrated ChatHistory sidebar
  if (activeSection === 'chat') {
    return (
      <div className="h-screen bg-background">
        <ChatView onNavigate={setActiveSection} />
      </div>
    );
  }

  // Management Mode: Traditional sidebar + content layout
  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Management Header with Back to Chat */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={handleBackToChat} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <div className="w-px h-6 bg-border"></div>
              <h1 className="text-lg font-semibold capitalize">{activeSection}</h1>
            </div>

            <Button variant="outline" size="sm" onClick={handleBackToChat} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </Button>
          </div>
        </div>

        {/* Management Content */}
        <div className="flex-1 overflow-hidden">{renderManagementContent()}</div>
      </main>

      {/* Chat Interface Overlay (for management screens) */}
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

      {/* Minimized Chat Tabs */}
      {minimizedChats.length > 0 && (
        <div className="fixed bottom-4 right-4 z-40 flex gap-2">
          {minimizedChats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => handleRestoreChat(chat)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              {chat.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
