import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Plus,
  Hammer,
  Play,
  Settings,
  Trash2,
  Edit3,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from '../layout/EmptyState';

interface CustomTool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'testing' | 'error';
  createdAt: Date;
  lastUsed?: Date;
  usageCount: number;
  apiEndpoint: string;
  method: string;
  parameters: string[];
}

interface ToolBuilderProps {
  onCreateTool: () => void;
}

export function ToolBuilder({ onCreateTool }: ToolBuilderProps) {
  const [customTools] = useState<CustomTool[]>([
    {
      id: 'tool-slack-001',
      name: 'Slack Messenger',
      description: 'Send messages to Slack channels and users',
      category: 'communication',
      status: 'active',
      createdAt: new Date(2024, 1, 15),
      lastUsed: new Date(Date.now() - 1000 * 60 * 30),
      usageCount: 47,
      apiEndpoint: 'https://slack.com/api/chat.postMessage',
      method: 'POST',
      parameters: ['channel', 'text', 'username'],
    },
    {
      id: 'tool-weather-002',
      name: 'Weather API',
      description: 'Get current weather information for any location',
      category: 'data',
      status: 'active',
      createdAt: new Date(2024, 1, 10),
      lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2),
      usageCount: 23,
      apiEndpoint: 'https://api.openweathermap.org/data/2.5/weather',
      method: 'GET',
      parameters: ['q', 'appid', 'units'],
    },
    {
      id: 'tool-github-003',
      name: 'GitHub Issue Creator',
      description: 'Create new issues in GitHub repositories',
      category: 'development',
      status: 'testing',
      createdAt: new Date(2024, 1, 20),
      usageCount: 5,
      apiEndpoint: 'https://api.github.com/repos/{owner}/{repo}/issues',
      method: 'POST',
      parameters: ['title', 'body', 'labels'],
    },
  ]);

  const [showEmptyState, setShowEmptyState] = useState(false);
  const currentTools = showEmptyState ? [] : customTools;

  const getStatusIcon = (status: CustomTool['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-status-active" />;
      case 'testing':
        return <Clock className="w-4 h-4 text-status-idle" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-status-error" />;
    }
  };

  const getStatusBadge = (status: CustomTool['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="status-active-subtle">Active</Badge>;
      case 'testing':
        return <Badge className="status-idle-subtle">Testing</Badge>;
      case 'error':
        return <Badge className="status-error-subtle">Error</Badge>;
    }
  };

  const formatLastUsed = (date?: Date) => {
    if (!date) {
      return 'Never';
    }

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${days}d ago`;
  };

  const stats = {
    total: currentTools.length,
    active: currentTools.filter((t) => t.status === 'active').length,
    testing: currentTools.filter((t) => t.status === 'testing').length,
    totalUsage: currentTools.reduce((sum, t) => sum + t.usageCount, 0),
  };

  if (currentTools.length === 0) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="max-w-md">
          <EmptyState
            type="tools"
            title="No Custom Tools Yet"
            description="Create your first AI-powered custom tool! Simply describe what you want in natural language, and our AI assistant will generate a working tool for you."
            actionLabel="Create First Tool"
            onAction={onCreateTool}
            secondaryAction={{
              label: 'Show Demo Tools',
              onClick: () => setShowEmptyState(false),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Tool Builder</h1>
          <p className="text-muted-foreground">Create and manage your custom AI tools</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowEmptyState(!showEmptyState)}>
            {showEmptyState ? 'Show Tools' : 'Demo Empty State'}
          </Button>
          <Button onClick={onCreateTool} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Tool
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Hammer className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Tools</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-status-active-background rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-status-active" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.active}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-status-idle-background rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-status-idle" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.testing}</p>
                <p className="text-sm text-muted-foreground">Testing</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-semibold">{stats.totalUsage}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tools Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your Custom Tools</h2>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {currentTools.map((tool) => (
            <Card key={tool.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(tool.status)}
                    <CardTitle className="text-base">{tool.name}</CardTitle>
                  </div>
                  {getStatusBadge(tool.status)}
                </div>
                <CardDescription className="text-sm">{tool.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <Badge variant="outline">{tool.method}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Usage:</span>
                    <span>{tool.usageCount} times</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last used:</span>
                    <span>{formatLastUsed(tool.lastUsed)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button size="sm" variant="outline" className="flex-1 gap-1">
                    <Play className="w-3 h-3" />
                    Test
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Edit3 className="w-3 h-3" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Settings className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
