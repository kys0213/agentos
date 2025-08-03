import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
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
  const [filterStatus, setFilterStatus] = useState('all');

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
      description: 'Creative writing and content generation specialist',
      preset: 'Writing Specialist',
      status: 'idle',
      lastActive: '1 hour ago',
      totalChats: 28,
      capabilities: ['Creative Writing', 'SEO', 'Copywriting', 'Translation'],
      performance: 88,
    },
    {
      id: 4,
      name: 'Research Assistant',
      description: 'Information gathering and analysis expert',
      preset: 'Research Specialist',
      status: 'inactive',
      lastActive: '2 days ago',
      totalChats: 12,
      capabilities: ['Web Research', 'Fact Checking', 'Summarization'],
      performance: 85,
    },
  ];

  const filteredAgents = subAgents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || agent.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'inactive':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'idle':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">SubAgent Manager</h1>
          <p className="text-muted-foreground">Manage and monitor your AI sub-agents</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create New Agent
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'idle', 'inactive'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Agents</p>
              <p className="text-xl font-semibold">{subAgents.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Play className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-xl font-semibold">
                {subAgents.filter((a) => a.status === 'active').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Chats</p>
              <p className="text-xl font-semibold">
                {subAgents.reduce((sum, agent) => sum + agent.totalChats, 0)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Performance</p>
              <p className="text-xl font-semibold">
                {Math.round(
                  subAgents.reduce((sum, agent) => sum + agent.performance, 0) / subAgents.length
                )}
                %
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div
                      className={`w-3 h-3 ${getStatusColor(agent.status)} rounded-full border-2 border-white absolute -bottom-1 -right-1`}
                    ></div>
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <Badge variant={getStatusBadge(agent.status)} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground">{agent.description}</p>

              {/* Capabilities */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {agent.capabilities.map((capability, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {capability}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Total Chats</p>
                  <p className="text-sm font-medium">{agent.totalChats}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Performance</p>
                  <p className="text-sm font-medium">{agent.performance}%</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Last Active</p>
                <p className="text-sm font-medium">{agent.lastActive}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => onOpenChat?.(agent.id, agent.name, agent.preset)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Chat
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <div className="text-center py-12">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No agents found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first sub-agent to get started'}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create New Agent
          </Button>
        </div>
      )}
    </div>
  );
}
