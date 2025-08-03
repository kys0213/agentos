import React from 'react';
import { AppModeState } from '../../types/chat-types';
import { Button } from '../ui/button';
import { Home, Layers, Bot, Cpu, Wrench, Network, Settings } from 'lucide-react';

interface SidebarProps {
  activeSection: AppModeState['activeSection'];
  onSectionChange: (section: AppModeState['activeSection']) => void;
}

/**
 * 관리 화면용 사이드바
 */
const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'presets', label: 'Presets', icon: Layers },
    { id: 'subagents', label: 'Agents', icon: Bot },
    { id: 'models', label: 'Models', icon: Cpu },
    { id: 'tools', label: 'Tools', icon: Wrench },
    { id: 'racp', label: 'RACP', icon: Network },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-100 flex flex-col">
      <div className="p-4 border-b bg-white">
        <h2 className="font-semibold text-lg">Management</h2>
        <p className="text-sm text-muted-foreground">System configuration</p>
      </div>

      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className="w-full justify-start gap-3"
                onClick={() => onSectionChange(item.id)}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
