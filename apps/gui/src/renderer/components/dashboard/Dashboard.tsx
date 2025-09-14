import type { AgentMetadata, Preset } from '@agentos/core';
import { Activity, Bot, Cpu, Layers, MessageSquare } from 'lucide-react';
import { useDashboardStats } from '../../hooks/queries/use-dashboard';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';

interface DashboardProps {
  presets: Preset[];
  currentAgents: AgentMetadata[];
  onOpenChat?: (agentId: string) => void;
  loading: boolean;
  onCreateAgent: () => void;
}

export function Dashboard({
  onOpenChat,
  presets,
  currentAgents,
  loading,
  onCreateAgent,
}: DashboardProps) {
  const { data: ds, isLoading: statsLoading, isError: statsError } = useDashboardStats();
  const qc = useQueryClient();
  const retry = () => qc.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
  // Real-time stats from actual data (with graceful fallbacks)
  const cards = [
    {
      title: 'Active Chats',
      value: statsLoading || statsError || ds?.activeChats == null ? '—' : String(ds.activeChats),
      change:
        statsLoading || statsError ? '' : ds?.meta.chatsOk ? '+2 from yesterday' : 'Error • Retry',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      title: 'Agents',
      value:
        statsLoading || statsError
          ? String(currentAgents.length)
          : ds?.agents.total != null
            ? String(ds.agents.total)
            : String(currentAgents.length),
      change:
        statsLoading || statsError
          ? `${currentAgents.filter((a) => a.status === 'active').length} active`
          : ds?.meta.agentsOk
            ? `${ds?.agents.active ?? '—'} active`
            : 'Error • Retry',
      icon: Bot,
      color: 'text-green-600',
    },
    {
      title: 'Models',
      value:
        statsLoading || statsError || ds?.bridges.models == null ? '—' : String(ds.bridges.models),
      change:
        statsLoading || statsError || ds?.bridges.total == null
          ? ''
          : ds?.meta.bridgesOk
            ? `Bridges: ${ds.bridges.total}`
            : 'Error • Retry',
      icon: Cpu,
      color: 'text-purple-600',
    },
    {
      title: 'Presets',
      value:
        statsLoading || statsError
          ? String(presets.length)
          : ds?.presets.total != null
            ? String(ds.presets.total)
            : String(presets.length),
      change:
        statsLoading || statsError
          ? `${presets.filter((p) => p.usageCount && p.usageCount > 0).length} in use`
          : ds?.meta.presetsOk
            ? `${ds?.presets.inUse ?? 0} in use`
            : 'Error • Retry',
      icon: Layers,
      color: 'text-orange-600',
    },
  ];

  // Add MCP 24h card when available
  if (!statsLoading && !statsError && ds?.mcp24h?.requests != null) {
    cards.push({
      title: 'MCP (24h)',
      value: String(ds.mcp24h.requests),
      change: ds.meta.mcpOk ? '' : 'Error • Retry',
      icon: Activity,
      color: 'text-blue-600',
    });
  }

  // Derive recent activity-like insights from actual data
  const topAgent = [...currentAgents].sort((a, b) => (b.usageCount ?? 0) - (a.usageCount ?? 0))[0];
  const recentActivity = [
    topAgent && {
      id: 1,
      type: 'agent',
      title: `Top agent: ${topAgent.name}`,
      time: `${topAgent.usageCount ?? 0} uses`,
      agent: topAgent.name,
    },
    presets[0] && {
      id: 2,
      type: 'preset',
      title: `Popular preset: ${presets[0].name}`,
      time: `${presets[0].usageCount ?? 0} uses`,
      agent: 'System',
    },
    ds?.bridges.total != null && {
      id: 3,
      type: 'bridge',
      title: `Installed bridges: ${ds.bridges.total}`,
      time: 'Configured',
      agent: 'System',
    },
  ].filter(Boolean) as Array<{
    id: number;
    type: string;
    title: string;
    time: string;
    agent: string;
  }>;

  // Smart quick actions based on available agents and presets
  const bestAgent = currentAgents.find((a) => a.status === 'active') || currentAgents[0];
  const favoritePreset = presets.find((p) => p.usageCount && p.usageCount > 0) || presets[0];

  const quickActions = [
    {
      title: 'Start New Chat',
      description: bestAgent
        ? `Chat with ${bestAgent.name}`
        : 'Begin a conversation with an AI agent',
      icon: MessageSquare,
      action: () => {
        if (bestAgent) {
          onOpenChat?.(bestAgent.id);
        }
      },
      color: 'bg-blue-500',
      disabled: !bestAgent,
    },
    {
      title: 'Create Agent',
      description: currentAgents.length > 0 ? 'Add another agent' : 'Create your first agent',
      icon: Bot,
      action: () => {
        onCreateAgent();
      },
      color: 'bg-green-500',
    },
    {
      title: 'Popular Preset',
      description: favoritePreset
        ? `Use ${favoritePreset.name}`
        : 'Configure agent presets and prompts',
      icon: Layers,
      action: () => {
        if (favoritePreset && bestAgent) {
          onOpenChat?.(bestAgent.id);
        }
      },
      color: 'bg-purple-500',
      disabled: !favoritePreset || !bestAgent,
    },
    {
      title: 'System Overview',
      description: `${currentAgents.length} agents, ${presets.length} presets ready`,
      icon: Activity,
      action: () =>
        console.log('System status:', { agents: currentAgents.length, presets: presets.length }),
      color: 'bg-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-muted-foreground">Loading your agent ecosystem...</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-8 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Optionally include MCP requests card if available
  if (!statsLoading && !statsError && ds?.mcp?.requests != null) {
    cards.push({
      title: 'MCP Requests',
      value: String(ds.mcp.requests),
      change: ds.meta.mcpOk ? '' : 'Error • Retry',
      icon: Activity,
      color: 'text-blue-600',
    });
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your agents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{stat.change}</span>
                    {!statsLoading && !statsError && String(stat.change).includes('Retry') && (
                      <Button variant="outline" size="sm" onClick={retry} className="h-7 px-2">
                        Retry
                      </Button>
                    )}
                  </div>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Activity</h3>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm">{activity.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {activity.agent}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className={`w-full h-auto p-4 justify-start ${
                    action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={action.disabled ? undefined : action.action}
                  disabled={action.disabled}
                >
                  <div
                    className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mr-3`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-sm text-muted-foreground">{action.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                currentAgents.length > 0 ? 'bg-green-500' : 'bg-red-500'
              }`}
            ></div>
            <div>
              <p className="text-sm font-medium">Agent Services</p>
              <p className="text-xs text-muted-foreground">
                {currentAgents.length > 0
                  ? `${currentAgents.filter((a) => a.status === 'active').length}/${currentAgents.length} agents ready`
                  : 'No agents configured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                presets.length > 0 ? 'bg-green-500' : 'bg-yellow-500'
              }`}
            ></div>
            <div>
              <p className="text-sm font-medium">Preset Library</p>
              <p className="text-xs text-muted-foreground">
                {presets.length > 0
                  ? `${presets.length} presets available`
                  : 'No presets configured'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Core Services</p>
              <p className="text-xs text-muted-foreground">ServiceContainer ready</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
