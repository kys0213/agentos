import React from 'react';
import { AppModeState } from '../../types/chat-types';
import Sidebar from './Sidebar';
import { Button } from '../ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface ManagementViewProps {
  activeSection: AppModeState['activeSection'];
  onSectionChange: (section: AppModeState['activeSection']) => void;
  onBackToChat: () => void;
}

/**
 * 관리 화면 - 기존 Dashboard, Presets 등 기능 제공
 */
const ManagementView: React.FC<ManagementViewProps> = ({
  activeSection,
  onSectionChange,
  onBackToChat,
}) => {
  const renderManagementContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">Dashboard content coming soon...</p>
          </div>
        );
      case 'presets':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Presets</h1>
            <p className="text-muted-foreground">Preset management coming soon...</p>
          </div>
        );
      case 'subagents':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Agents</h1>
            <p className="text-muted-foreground">Agent management coming soon...</p>
          </div>
        );
      case 'models':
        return (
          <div className="p-6">
            <h1 className="text-2xl font-semibold">Models</h1>
            <p className="text-muted-foreground">Model configuration coming soon...</p>
          </div>
        );
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

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />

      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Management Header with Back to Chat */}
        <div className="border-b bg-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={onBackToChat} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
              </Button>
              <div className="w-px h-6 bg-border"></div>
              <h1 className="text-lg font-semibold capitalize">{activeSection}</h1>
            </div>

            <Button variant="outline" size="sm" onClick={onBackToChat} className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </Button>
          </div>
        </div>

        {/* Management Content */}
        <div className="flex-1 overflow-hidden">{renderManagementContent()}</div>
      </main>
    </div>
  );
};

export default ManagementView;
