import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Code,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  Globe,
  Image as ImageIcon,
  Link,
  Plus,
  Search,
  Settings,
  TrendingUp,
  Unlink,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { McpToolMetadata, McpUsageLog } from '@agentos/core';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

/**
 * GUI-specific extension of Core McpToolMetadata
 * Core 타입을 기반으로 GUI 전용 필드들을 추가
 */
interface GuiMcpTool extends McpToolMetadata {
  /** GUI 전용: React 아이콘 컴포넌트 */
  icon: React.ReactNode;
  /** API 키 (옵셔널, GUI에서만 관리) */
  apiKey?: string;
}

/**
 * Core McpUsageLog를 GUI에서 그대로 사용
 * Core 타입이 이미 모든 필요한 필드를 포함하고 있음
 */
type GuiMcpUsageLog = McpUsageLog;

export function MCPToolsManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [tools, setTools] = useState<GuiMcpTool[]>([]);
  const [usageLogs, setUsageLogs] = useState<GuiMcpUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    setTimeout(() => {
      const mockTools: GuiMcpTool[] = [
        {
          id: 'web-search',
          name: 'Web Search',
          description: 'Search the web for current information and news',
          category: 'search',
          status: 'connected',
          version: '2.1.0',
          provider: 'SearchAPI',
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 30),
          usageCount: 245,
          endpoint: 'https://api.searchapi.com/v2',
          permissions: ['search', 'read'],
          icon: <Globe className="w-5 h-5" />,
        },
        {
          id: 'code-executor',
          name: 'Code Executor',
          description: 'Execute Python, JavaScript, and other code snippets safely',
          category: 'development',
          status: 'connected',
          version: '1.5.2',
          provider: 'CodeSandbox',
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
          usageCount: 89,
          permissions: ['execute', 'file-system'],
          icon: <Code className="w-5 h-5" />,
        },
        {
          id: 'image-generator',
          name: 'Image Generator',
          description: 'Generate images from text descriptions using AI',
          category: 'creative',
          status: 'error',
          version: '3.0.1',
          provider: 'DALL-E API',
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
          usageCount: 156,
          permissions: ['generate', 'read'],
          icon: <ImageIcon className="w-5 h-5" />,
        },
        {
          id: 'database-query',
          name: 'Database Query',
          description: 'Query SQL databases and retrieve structured data',
          category: 'data',
          status: 'connected',
          version: '4.2.1',
          provider: 'PostgreSQL',
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 15),
          usageCount: 67,
          permissions: ['read', 'write', 'admin'],
          icon: <Database className="w-5 h-5" />,
        },
        {
          id: 'file-processor',
          name: 'File Processor',
          description: 'Process various file formats (PDF, DOC, CSV, etc.)',
          category: 'productivity',
          status: 'pending',
          version: '2.3.0',
          provider: 'FileStack',
          usageCount: 34,
          permissions: ['read', 'write'],
          icon: <FileText className="w-5 h-5" />,
        },
        {
          id: 'analytics-api',
          name: 'Analytics API',
          description: 'Advanced data analytics and visualization tools',
          category: 'analytics',
          status: 'disconnected',
          version: '1.8.5',
          provider: 'Google Analytics',
          lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          usageCount: 123,
          permissions: ['read'],
          icon: <BarChart3 className="w-5 h-5" />,
        },
      ];

      const mockLogs: GuiMcpUsageLog[] = [
        {
          id: 'log-1',
          toolId: 'web-search',
          toolName: 'Web Search',
          agentId: 'agent-1',
          agentName: 'Research Assistant',
          action: 'search',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          duration: 2340,
          status: 'success',
          parameters: { query: 'latest AI developments 2024' },
        },
        {
          id: 'log-2',
          toolId: 'code-executor',
          toolName: 'Code Executor',
          agentId: 'agent-2',
          agentName: 'Code Assistant',
          action: 'execute',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          duration: 5670,
          status: 'success',
          parameters: { language: 'python', code: 'data_analysis.py' },
        },
        {
          id: 'log-3',
          toolId: 'image-generator',
          toolName: 'Image Generator',
          agentId: 'agent-3',
          agentName: 'Content Writer',
          action: 'generate',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
          duration: 0,
          status: 'error',
          parameters: { prompt: 'futuristic city skyline' },
        },
      ];

      setTools(mockTools);
      setUsageLogs(mockLogs);
      setIsLoading(false);
    }, 800);
  }, []);

  const categories = [
    { id: 'all', label: 'All Tools', count: tools.length },
    { id: 'search', label: 'Search', count: tools.filter((t) => t.category === 'search').length },
    {
      id: 'development',
      label: 'Development',
      count: tools.filter((t) => t.category === 'development').length,
    },
    {
      id: 'creative',
      label: 'Creative',
      count: tools.filter((t) => t.category === 'creative').length,
    },
    { id: 'data', label: 'Data', count: tools.filter((t) => t.category === 'data').length },
    {
      id: 'productivity',
      label: 'Productivity',
      count: tools.filter((t) => t.category === 'productivity').length,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      count: tools.filter((t) => t.category === 'analytics').length,
    },
  ];

  const filteredTools = tools.filter((tool) => {
    const matchesSearch =
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      connected: 'default',
      disconnected: 'secondary',
      error: 'destructive',
      pending: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const connectedTools = tools.filter((t) => t.status === 'connected').length;
  const errorTools = tools.filter((t) => t.status === 'error').length;
  const totalUsage = tools.reduce((sum, tool) => sum + tool.usageCount, 0);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">MCP Tools</h1>
            <p className="text-muted-foreground">
              Manage Model Context Protocol tools and integrations
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Tool
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{connectedTools}</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{errorTools}</p>
                <p className="text-sm text-muted-foreground">Errors</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalUsage}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{tools.length}</p>
                <p className="text-sm text-muted-foreground">Total Tools</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tools">Tools</TabsTrigger>
              <TabsTrigger value="usage">Usage Logs</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="overview" className="h-full">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {usageLogs.slice(0, 5).map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              log.status === 'success'
                                ? 'bg-green-500'
                                : log.status === 'error'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{log.toolName}</p>
                            <p className="text-xs text-muted-foreground">
                              Used by {log.agentName} • {formatTimeAgo(log.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                          {log.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                <div className="grid grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Tool Status Distribution</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-foreground">Connected</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {connectedTools}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-foreground">Error</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{errorTools}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-foreground">Pending</span>
                        </div>
                        <span className="text-sm font-medium text-foreground">
                          {tools.filter((t) => t.status === 'pending').length}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Most Used Tools</h3>
                    <div className="space-y-3">
                      {tools
                        .sort((a, b) => b.usageCount - a.usageCount)
                        .slice(0, 5)
                        .map((tool) => (
                          <div key={tool.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {tool.icon}
                              <span className="text-sm text-foreground">{tool.name}</span>
                            </div>
                            <span className="text-sm font-medium text-foreground">
                              {tool.usageCount}
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tools" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex gap-1">
                    {categories.map((category) => (
                      <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="gap-1"
                      >
                        {category.label}
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {category.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tools Grid */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {isLoading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="p-6">
                              <Skeleton className="w-full h-32" />
                            </Card>
                          ))
                        : filteredTools.map((tool) => (
                            <Card key={tool.id} className="p-6 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                    {tool.icon}
                                  </div>
                                  <div>
                                    <h3 className="font-medium text-foreground">{tool.name}</h3>
                                    <p className="text-sm text-muted-foreground">{tool.provider}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(tool.status)}
                                  {getStatusBadge(tool.status)}
                                </div>
                              </div>

                              <p className="text-sm text-muted-foreground mb-4">
                                {tool.description}
                              </p>

                              <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Version:</span>
                                  <span className="font-medium text-foreground">
                                    {tool.version}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">Usage:</span>
                                  <span className="font-medium text-foreground">
                                    {tool.usageCount}
                                  </span>
                                </div>
                                {tool.lastUsedAt && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last used:</span>
                                    <span className="font-medium text-foreground">
                                      {formatTimeAgo(tool.lastUsedAt)}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1">
                                  <Settings className="w-3 h-3 mr-1" />
                                  Configure
                                </Button>
                                <Button
                                  variant={tool.status === 'connected' ? 'destructive' : 'default'}
                                  size="sm"
                                >
                                  {tool.status === 'connected' ? (
                                    <>
                                      <Unlink className="w-3 h-3 mr-1" />
                                      Disconnect
                                    </>
                                  ) : (
                                    <>
                                      <Link className="w-3 h-3 mr-1" />
                                      Connect
                                    </>
                                  )}
                                </Button>
                              </div>
                            </Card>
                          ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="h-full">
              <div className="h-full flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search usage logs..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export
                  </Button>
                </div>

                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="space-y-3">
                      {usageLogs.map((log) => (
                        <Card key={log.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-3 h-3 rounded-full ${
                                  log.status === 'success'
                                    ? 'bg-green-500'
                                    : log.status === 'error'
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                }`}
                              ></div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {log.toolName}
                                  </span>
                                  <span className="text-sm text-muted-foreground">•</span>
                                  <span className="text-sm text-muted-foreground">
                                    {log.action}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>Used by {log.agentName}</span>
                                  <span>•</span>
                                  <span>{formatTimeAgo(log.timestamp)}</span>
                                  <span>•</span>
                                  <span>{log.duration}ms</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                {log.status}
                              </Badge>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="h-full">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Tool Permissions by Agent</h3>
                  <p className="text-muted-foreground mb-6">
                    Manage which tools each agent can access and what actions they can perform.
                  </p>

                  <div className="space-y-4">
                    {[
                      'Research Assistant',
                      'Code Assistant',
                      'Content Writer',
                      'Data Analyzer',
                    ].map((agent) => (
                      <div key={agent} className="border rounded-lg p-4">
                        <h4 className="font-medium text-foreground mb-3">{agent}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {tools.slice(0, 6).map((tool) => (
                            <div key={tool.id} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {tool.icon}
                                <span className="text-sm text-foreground">{tool.name}</span>
                              </div>
                              <Switch defaultChecked={Math.random() > 0.5} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Global Tool Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Auto-connect new tools
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Automatically connect compatible tools when they become available
                        </p>
                      </div>
                      <Switch />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Enable usage analytics
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Collect usage statistics to improve tool performance
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Require permission for new tools
                        </label>
                        <p className="text-xs text-muted-foreground">
                          Ask before agents can access newly connected tools
                        </p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">API Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Default timeout (seconds)
                      </label>
                      <Input type="number" defaultValue="30" className="w-24" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Max concurrent requests
                      </label>
                      <Input type="number" defaultValue="10" className="w-24" />
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Rate limit (requests/minute)
                      </label>
                      <Input type="number" defaultValue="100" className="w-24" />
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
