import {
  Book,
  Bot,
  Cpu,
  Hammer,
  Home,
  MessageSquare,
  Plus,
  Settings,
  Shield,
  Wrench,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { AppSection } from '../../stores/store-types';
import { Button } from '../ui/button';

interface SidebarProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

/**
 * Modern collapsible sidebar with AgentOS branding
 * Migrated from new design to replace the existing management sidebar
 * Maintains compatibility with ServiceContainer and Core types
 */
const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'subagents', label: 'Agents', icon: Bot },
    { id: 'presets', label: 'Presets', icon: Book },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'toolbuilder', label: 'Tool Builder', icon: Hammer },
    { id: 'racp', label: 'RACP', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div
      className={`bg-sidebar border-r border-sidebar-border transition-all duration-200 flex flex-col relative ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* AgentOS Brand Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <Zap className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-semibold text-sidebar-foreground">AgentOS</h1>
              <p className="text-xs text-sidebar-foreground/60">MCP Host Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full justify-start gap-3 transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } ${isCollapsed ? 'px-3' : 'px-3'}`}
              onClick={() => onSectionChange(item.id)}
              data-testid={`nav-${item.id}`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Plus className="w-4 h-4" /> : 'Collapse'}
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;
