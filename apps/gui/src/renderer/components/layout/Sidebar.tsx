import {
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
import React, { useMemo, useState } from 'react';
import { AppSection } from '../../stores/store-types';
import { Button } from '../ui/button';

interface SidebarProps {
  activeSection: AppSection;
  onSectionChange: (section: AppSection) => void;
}

/**
 * Collapsible management sidebar aligned with the design reference.
 */
const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = useMemo(
    () =>
      [
        { id: 'dashboard', label: 'Dashboard', icon: Home },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'subagents', label: 'Agents', icon: Bot },
        { id: 'models', label: 'Models', icon: Cpu },
        { id: 'tools', label: 'Tools', icon: Wrench },
        { id: 'toolbuilder', label: 'Tool Builder', icon: Hammer },
        { id: 'racp', label: 'RACP', icon: Shield },
        { id: 'settings', label: 'Settings', icon: Settings },
      ] as const,
    []
  );

  const widthClass = isCollapsed ? 'w-16' : 'w-64';
  const navAlignmentClass = isCollapsed ? 'justify-center' : 'justify-start gap-3';

  return (
    <aside
      className={`relative flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200 ${widthClass}`}
    >
      {/* Brand header */}
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

      {/* Navigation */}
      <nav className="flex-1 p-4 pb-20 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <Button
              key={item.id}
              variant={isActive ? 'default' : 'ghost'}
              className={`w-full ${navAlignmentClass} transition-colors ${
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

      {/* Collapse toggle */}
      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <Plus className="w-4 h-4" /> : 'Collapse'}
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
