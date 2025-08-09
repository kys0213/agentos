import { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Bot, Search, Zap, Database, CheckCircle, Clock, MinusCircle } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'idle' | 'inactive';
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

interface MentionAutocompleteProps {
  agents: Agent[];
  query: string;
  position: { top: number; left: number };
  onSelect: (agent: Agent) => void;
  onClose: () => void;
  selectedIndex: number;
}

export function MentionAutocomplete({
  agents,
  query,
  position,
  onSelect,
  onClose,
  selectedIndex,
}: MentionAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter agents based on query
  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(query.toLowerCase()) ||
      agent.description.toLowerCase().includes(query.toLowerCase()) ||
      agent.category.toLowerCase().includes(query.toLowerCase()) ||
      agent.tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
  );

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = containerRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Search className="w-4 h-4" />;
      case 'development':
        return <Bot className="w-4 h-4" />;
      case 'creative':
        return <Zap className="w-4 h-4" />;
      case 'analytics':
        return <Database className="w-4 h-4" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="text-xs gap-1 status-active">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="text-xs gap-1 status-idle">
            <Clock className="w-3 h-3" />
            Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="text-xs gap-1 status-inactive-subtle">
            <MinusCircle className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  if (filteredAgents.length === 0) {
    return (
      <Card
        ref={containerRef}
        className="absolute z-50 w-80 p-3 shadow-lg border"
        style={{
          top: position.top,
          left: position.left,
          maxHeight: '200px',
        }}
      >
        <div className="text-center text-muted-foreground py-4">
          <Bot className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No agents found matching "{query}"</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className="absolute z-50 w-80 shadow-lg border"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: '300px',
      }}
    >
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">Available Agents</span>
          <Badge variant="outline" className="text-xs">
            {filteredAgents.length}
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[200px]">
        <div className="p-1">
          {filteredAgents.map((agent, index) => (
            <div
              key={agent.id}
              data-index={index}
              className={`flex items-center gap-3 p-3 rounded cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-accent' : 'hover:bg-accent/50'
              }`}
              onClick={() => onSelect(agent)}
            >
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                {getCategoryIcon(agent.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">{agent.name}</span>
                  {getStatusBadge(agent.status)}
                </div>
                <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="capitalize">{agent.category}</span>
                  <span>•</span>
                  <span>{agent.usageCount} uses</span>
                  {agent.lastUsed && (
                    <>
                      <span>•</span>
                      <span>Last used {agent.lastUsed.toLocaleDateString()}</span>
                    </>
                  )}
                </div>
                {/* Show tags if available */}
                {agent.tags && agent.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {agent.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span
                        key={tagIndex}
                        className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {agent.tags.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{agent.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t bg-gray-50/50">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>↑↓ Navigate</span>
          <span>Enter to select</span>
          <span>Esc to close</span>
        </div>
      </div>
    </Card>
  );
}
