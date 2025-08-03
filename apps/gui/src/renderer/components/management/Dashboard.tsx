import React from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Bot,
  MessageSquare,
  Cpu,
  Layers,
  Activity,
  Clock,
  TrendingUp,
  Users,
  Zap,
  BarChart3,
} from 'lucide-react';

interface DashboardProps {
  onOpenChat?: (agentId: number, agentName: string, agentPreset: string) => void;
}

export function Dashboard({ onOpenChat }: DashboardProps) {
  const stats = [
    {
      title: 'Active Chats',
      value: '12',
      change: '+2.5%',
      icon: MessageSquare,
      color: 'text-blue-600',
    },
    {
      title: 'Sub Agents',
      value: '8',
      change: '+12%',
      icon: Bot,
      color: 'text-green-600',
    },
    {
      title: 'Models',
      value: '5',
      change: '0%',
      icon: Cpu,
      color: 'text-purple-600',
    },
    {
      title: 'Presets',
      value: '15',
      change: '+5%',
      icon: Layers,
      color: 'text-orange-600',
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'chat',
      title: 'New chat started with Data Analyzer',
      time: '2 minutes ago',
      agent: 'Data Analyzer',
    },
    {
      id: 2,
      type: 'agent',
      title: 'Code Assistant agent updated',
      time: '15 minutes ago',
      agent: 'Code Assistant',
    },
    {
      id: 3,
      type: 'preset',
      title: 'Writing Specialist preset created',
      time: '1 hour ago',
      agent: 'Content Writer',
    },
    {
      id: 4,
      type: 'model',
      title: 'GPT-4 model connected',
      time: '2 hours ago',
      agent: 'System',
    },
  ];

  const quickActions = [
    {
      title: 'Start New Chat',
      description: 'Begin a conversation with an AI agent',
      icon: MessageSquare,
      action: () => onOpenChat?.(1, 'General Assistant', 'Default'),
      color: 'bg-blue-500',
    },
    {
      title: 'Create Agent',
      description: 'Set up a new sub-agent with specific capabilities',
      icon: Bot,
      action: () => console.log('Create agent'),
      color: 'bg-green-500',
    },
    {
      title: 'Manage Presets',
      description: 'Configure agent presets and prompts',
      icon: Layers,
      action: () => console.log('Manage presets'),
      color: 'bg-purple-500',
    },
    {
      title: 'System Health',
      description: 'Monitor system performance and status',
      icon: Activity,
      action: () => console.log('System health'),
      color: 'bg-orange-500',
    },
  ];

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
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-sm text-green-600">{stat.change}</p>
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
                  className="w-full h-auto p-4 justify-start"
                  onClick={action.action}
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
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">MCP Connections</p>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">Model Endpoints</p>
              <p className="text-xs text-muted-foreground">5/5 models online</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="text-sm font-medium">RACP Protocol</p>
              <p className="text-xs text-muted-foreground">2 pending connections</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
