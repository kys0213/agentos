import { useState } from "react";
import { Button } from "./ui/button";
import { 
  Home, 
  MessageSquare, 
  Users, 
  Settings, 
  Zap, 
  Bot,
  Cpu,
  Wrench,
  Shield,
  Plus,
  Hammer
} from "lucide-react";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "subagents", label: "Sub Agents", icon: Users },
    { id: "presets", label: "Presets", icon: Bot },
    { id: "models", label: "Models", icon: Cpu },
    { id: "tools", label: "Tools", icon: Wrench },
    { id: "toolbuilder", label: "Tool Builder", icon: Hammer },
    { id: "racp", label: "RACP", icon: Shield },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className={`bg-sidebar border-r border-sidebar-border transition-all duration-200 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
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

      <nav className="p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start gap-3 ${
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              } ${isCollapsed ? 'px-3' : 'px-3'}`}
              onClick={() => onSectionChange(item.id)}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="absolute bottom-4 left-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          {isCollapsed ? <Plus className="w-4 h-4" /> : "Collapse"}
        </Button>
      </div>
    </div>
  );
}