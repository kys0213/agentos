import { Agent, ReadonlyAgentMetadata } from '@agentos/core';
import {
  Bot,
  Filter,
  MessageSquare,
  MoreVertical,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  Star,
} from 'lucide-react';
import { useState } from 'react';
import { useAppData } from '../../hooks/useAppData';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

interface SubAgentManagerProps {
  onOpenChat?: (agentId: string) => void;
  agents: Agent[];
  onUpdateAgentStatus: (agentId: string, newStatus: 'active' | 'idle' | 'inactive') => void;
  onCreateAgent?: () => void;
}

export function SubAgentManager({
  agents,
  onUpdateAgentStatus,
  onOpenChat,
  onCreateAgent,
}: SubAgentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // TODO: 이 부분 수정 필요
  const { currentAgents, loading, handleCreateAgent, handleUpdateAgentStatus } = useAppData();

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.keywords.some((keyword) => keyword.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filtering
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'active') return matchesSearch && agent.status === 'active';
    if (selectedCategory === 'idle') return matchesSearch && agent.status === 'idle';
    if (selectedCategory === 'recent') {
      if (!agent.lastUsed) return false;
      return matchesSearch && Date.now() - agent.lastUsed.getTime() < 24 * 60 * 60 * 1000; // Last 24h
    }

    return matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'All Agents', count: agents.length },
    { id: 'active', label: 'Active', count: agents.filter((a) => a.status === 'active').length },
    { id: 'idle', label: 'Idle', count: agents.filter((a) => a.status === 'idle').length },
    {
      id: 'recent',
      label: 'Recent',
      count: agents.filter(
        (a) => a.lastUsed && Date.now() - a.lastUsed.getTime() < 24 * 60 * 60 * 1000
      ).length,
    },
  ];

  const getStatusColor = (status: ReadonlyAgentMetadata['status']) => {
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

  const getPerformanceScore = (agent: Agent) => {
    // Calculate performance based on usage count and recency
    const baseScore = Math.min(90, (agent.usageCount / 10) * 20); // Up to 90% from usage
    const recencyBonus =
      agent.lastUsed && Date.now() - agent.lastUsed.getTime() < 7 * 24 * 60 * 60 * 1000 ? 10 : 0;
    return Math.min(100, baseScore + recencyBonus);
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 90) return 'text-green-600';
    if (performance >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLastActive = (lastUsed?: Date) => {
    if (!lastUsed) return 'Never';
    const now = Date.now();
    const diff = now - lastUsed.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleCreateNewAgent = () => {
    const newAgent = handleCreateAgent({
      name: `Agent ${agents.length + 1}`,
      description: 'A new AI assistant ready to help',
      preset: {
        id: 'preset-1',
        name: 'Data Analysis Expert',
        description: 'Advanced data analysis and visualization specialist',
        author: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0',
        systemPrompt: 'You are a data analysis and visualization specialist',
        enabledMcps: [],
        llmBridgeName: 'openai',
        llmBridgeConfig: {},
        status: 'active',
        usageCount: 45,
        knowledgeDocuments: 45,
        knowledgeStats: {
          indexed: 45,
          vectorized: 45,
          totalSize: 45,
        },
        category: ['general'],
      },
    });
    console.log('Created agent:', newAgent);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Sub-Agent Manager</h1>
            <p className="text-muted-foreground">Loading your AI agents...</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sub-Agent Manager</h1>
          <p className="text-muted-foreground">Manage and monitor your AI sub-agents</p>
        </div>
        <Button className="gap-2" onClick={handleCreateNewAgent}>
          <Plus className="w-4 h-4" />
          Create Agent
        </Button>
      </div>

      {/* Filters and Categories */}
      <div className="space-y-4">
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

        {/* Categories */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex-shrink-0"
            >
              {category.label}
              <Badge variant="secondary" className="ml-2 text-xs">
                {category.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgents.length === 0 ? (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Bot className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first agent to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNewAgent} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Agent
              </Button>
            )}
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const performance = getPerformanceScore(agent);
            return (
              <Card key={agent.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center relative">
                      <Bot className="w-6 h-6 text-blue-600" />
                      {agent.usageCount > 30 && (
                        <Star className="w-3 h-3 text-yellow-500 absolute -top-1 -right-1 fill-current" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`w-2 h-2 ${getStatusColor(agent.status)} rounded-full`}
                        ></div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {agent.status}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {agent.keywords}
                        </Badge>
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
                    <span className={`font-semibold ${getPerformanceColor(performance)}`}>
                      {performance}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Chats</span>
                    <span className="font-semibold">{agent.usageCount}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Active</span>
                    <span className="font-semibold">{formatLastActive(agent.lastUsed)}</span>
                  </div>

                  {agent.keywords && agent.keywords.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                      <div className="flex flex-wrap gap-1">
                        {agent.keywords.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {agent.keywords.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{agent.keywords.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button size="sm" className="flex-1 gap-2" onClick={() => onOpenChat?.(agent.id)}>
                    <MessageSquare className="w-3 h-3" />
                    Chat
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() =>
                      handleUpdateAgentStatus(
                        agent.id,
                        agent.status === 'active' ? 'idle' : 'active'
                      )
                    }
                  >
                    {agent.status === 'active' ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            );
          })
        )}
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
                {agents.filter((a) => a.status === 'active').length}
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
                {agents.filter((a) => a.status === 'idle').length}
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
                {agents.reduce((sum, agent) => sum + agent.usageCount, 0)}
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
                {agents.length > 0
                  ? Math.round(
                      agents.reduce((sum, agent) => sum + getPerformanceScore(agent), 0) /
                        agents.length
                    )
                  : 0}
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
