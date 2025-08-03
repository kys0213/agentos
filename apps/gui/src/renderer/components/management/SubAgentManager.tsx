import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import {
  Bot,
  Plus,
  Settings,
  MessageSquare,
  MoreVertical,
  Search,
  Filter,
  Play,
  Pause,
  Trash2,
  Edit,
  Copy,
} from 'lucide-react';

interface SubAgentManagerProps {
  onOpenChat?: (agentId: number, agentName: string, agentPreset: string) => void;
}

export function SubAgentManager({ onOpenChat }: SubAgentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const subAgents = [
    {
      id: 1,
      name: 'Data Analyzer Pro',
      description: 'Advanced data analysis and visualization specialist',
      preset: 'Data Analysis Expert',
      status: 'active',
      lastActive: '2 minutes ago',
      totalChats: 45,
      capabilities: ['Data Analysis', 'Visualization', 'SQL', 'Python'],
      performance: 95,
    },
    {
      id: 2,
      name: 'Code Reviewer',
      description: 'Code quality assurance and debugging expert',
      preset: 'Development Helper',
      status: 'active',
      lastActive: '15 minutes ago',
      totalChats: 32,
      capabilities: ['Code Review', 'Debugging', 'Testing', 'Documentation'],
      performance: 92,
    },
    {
      id: 3,
      name: 'Content Creator',
      description: 'Creative writing and content generation assistant',
      preset: 'Writing Specialist',
      status: 'idle',
      lastActive: '2 hours ago',
      totalChats: 28,
      capabilities: ['Writing', 'Editing', 'SEO', 'Marketing'],
      performance: 88,
    },
    {
      id: 4,
      name: 'Research Assistant',
      description: 'Information gathering and analysis specialist',
      preset: 'Research Specialist',
      status: 'active',
      lastActive: '5 minutes ago',
      totalChats: 52,
      capabilities: ['Research', 'Fact-checking', 'Analysis', 'Summarization'],
      performance: 94,
    },
  ];

  const filteredAgents = subAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sub-Agent Manager</h1>
          <p className="text-muted-foreground">Manage and monitor your AI sub-agents</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Bot className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{agent.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 ${getStatusColor(agent.status)} rounded-full`}></div>
                    <span className="text-xs text-muted-foreground capitalize">{agent.status}</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Performance</span>
                <span className={`font-semibold ${getPerformanceColor(agent.performance)}`}>
                  {agent.performance}%
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Chats</span>
                <span className="font-semibold">{agent.totalChats}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Active</span>
                <span className="font-semibold">{agent.lastActive}</span>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.slice(0, 3).map((capability) => (
                    <Badge key={capability} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{agent.capabilities.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onOpenChat?.(agent.id, agent.name, agent.preset)}
              >
                <MessageSquare className="w-3 h-3" />
                Chat
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings className="w-3 h-3" />
                Config
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {subAgents.filter((a) => a.status === 'active').length}
              </p>
              <p className="text-xs text-muted-foreground">Active Agents</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Pause className="w-4 h-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {subAgents.filter((a) => a.status === 'idle').length}
              </p>
              <p className="text-xs text-muted-foreground">Idle Agents</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {subAgents.reduce((sum, agent) => sum + agent.totalChats, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Chats</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {Math.round(
                  subAgents.reduce((sum, agent) => sum + agent.performance, 0) / subAgents.length
                )}
                %
              </p>
              <p className="text-xs text-muted-foreground">Avg Performance</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
