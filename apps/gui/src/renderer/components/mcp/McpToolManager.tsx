import type { McpToolMetadata, McpUsageLog } from '@agentos/core';
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
  RefreshCw,
  Search,
  Settings,
  TrendingUp,
  Unlink,
  Wrench,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { McpConfig } from '@agentos/core';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useMcpUsageStream } from '../../hooks/queries/use-mcp-usage-stream';
import type { McpUsageUpdateEvent } from '../../../shared/types/mcp-usage-types';

const MAX_USAGE_LOGS = 100;

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
  const { lastEvent } = useMcpUsageStream();

  // Helper function to get icon for category
  const getIconForCategory = (category: string): React.ReactNode => {
    switch (category) {
      case 'search':
        return <Globe className="w-5 h-5" />;
      case 'development':
        return <Code className="w-5 h-5" />;
      case 'creative':
        return <ImageIcon className="w-5 h-5" />;
      case 'data':
        return <Database className="w-5 h-5" />;
      case 'productivity':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Wrench className="w-5 h-5" />;
    }
  };

  const computeId = (raw: Record<string, unknown>, fallbackName: string) =>
    typeof raw['id'] === 'string'
      ? (raw['id'] as string)
      : fallbackName.toLowerCase().replace(/\s+/g, '-');

  const asDate = (value: unknown | undefined): Date | undefined => {
    if (!value) {
      return undefined;
    }
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }
    return undefined;
  };

  const mapRawMetadata = (raw: Record<string, unknown>): GuiMcpTool => {
    const name = typeof raw['name'] === 'string' ? (raw['name'] as string) : 'Unknown Tool';
    const id = computeId(raw, name);
    const category = typeof raw['category'] === 'string' ? (raw['category'] as string) : 'other';
    const status =
      typeof raw['status'] === 'string'
        ? (raw['status'] as GuiMcpTool['status'])
        : ('disconnected' as GuiMcpTool['status']);
    const permissions = Array.isArray(raw['permissions']) ? (raw['permissions'] as string[]) : [];
    const usageCount = typeof raw['usageCount'] === 'number' ? (raw['usageCount'] as number) : 0;

    return {
      id,
      name,
      description: typeof raw['description'] === 'string' ? (raw['description'] as string) : '',
      category,
      status,
      version: typeof raw['version'] === 'string' ? (raw['version'] as string) : '1.0.0',
      provider: typeof raw['provider'] === 'string' ? (raw['provider'] as string) : undefined,
      usageCount,
      endpoint: typeof raw['endpoint'] === 'string' ? (raw['endpoint'] as string) : undefined,
      permissions,
      icon: getIconForCategory(category),
      lastUsedAt: asDate(raw['lastUsedAt']),
      config: raw['config'] as McpConfig | undefined,
    };
  };

  const normalizeUsageLogs = (logs: GuiMcpUsageLog[]): GuiMcpUsageLog[] =>
    logs.map((log) => ({
      ...log,
      timestamp: log.timestamp instanceof Date ? log.timestamp : new Date(log.timestamp),
    }));

  const matchesTool = (tool: GuiMcpTool, identifiers: Array<string | undefined>): boolean => {
    const lowered = identifiers
      .filter((value): value is string => Boolean(value))
      .map((value) => value.toLowerCase());
    if (lowered.length === 0) {
      return false;
    }
    const toolKeys = [tool.id, tool.name].filter(Boolean).map((value) => value.toLowerCase());
    return lowered.some((value) => toolKeys.includes(value));
  };

  const applyUsageLoggedEvent = (
    prevTools: GuiMcpTool[],
    event: Extract<McpUsageUpdateEvent, { type: 'usage-logged' }>
  ): GuiMcpTool[] =>
    prevTools.map((tool) => {
      if (!matchesTool(tool, [event.newLog.toolId, event.newLog.toolName, event.clientName])) {
        return tool;
      }
      return {
        ...tool,
        usageCount: (tool.usageCount ?? 0) + 1,
        lastUsedAt: event.newLog.timestamp,
      };
    });

  const applyMetadataUpdatedEvent = (
    prevTools: GuiMcpTool[],
    event: Extract<McpUsageUpdateEvent, { type: 'metadata-updated' }>
  ): GuiMcpTool[] => {
    const { metadata } = event;
    return prevTools.map((tool) => {
      if (!matchesTool(tool, [metadata.toolId, metadata.toolName, event.clientName])) {
        return tool;
      }
      return {
        ...tool,
        status: metadata.status ?? tool.status,
        usageCount: typeof metadata.usageCount === 'number' ? metadata.usageCount : tool.usageCount,
        lastUsedAt: asDate(metadata.lastUsedAt) ?? tool.lastUsedAt,
      };
    });
  };

  const applyConnectionChangedEvent = (
    prevTools: GuiMcpTool[],
    event: Extract<McpUsageUpdateEvent, { type: 'connection-changed' }>
  ): GuiMcpTool[] =>
    prevTools.map((tool) =>
      matchesTool(tool, [event.clientName])
        ? {
            ...tool,
            status: event.connectionStatus,
          }
        : tool
    );

  // Load data from ServiceContainer
  useEffect(() => {
    const loadMcpData = async () => {
      try {
        setIsLoading(true);

        if (ServiceContainer.has('mcp')) {
          const mcpService = ServiceContainer.getOrThrow('mcp');

          try {
            const mcpTools = await mcpService.getAllToolMetadata();
            const guiTools: GuiMcpTool[] = (mcpTools as Record<string, unknown>[]).map(
              mapRawMetadata
            );

            setTools(guiTools);

            // Get usage logs if available
            try {
              const usageService = ServiceContainer.getOrThrow('mcpUsageLog');
              const logs = await usageService.getAllUsageLogs();
              setUsageLogs(normalizeUsageLogs(logs));
            } catch (logError) {
              console.warn('Usage logs not available:', logError);
              setUsageLogs([]);
            }
          } catch (mcpError) {
            console.warn('MCP tools not available:', mcpError);
            // 폴백 데이터 제거: 빈 상태 유지, 에러는 콘솔/상태로 확인
            setTools([]);
            setUsageLogs([]);
          }
        } else {
          console.warn('MCP service not available in ServiceContainer');
          setTools([]);
          setUsageLogs([]);
        }
      } catch (error) {
        console.error('Failed to load MCP data:', error);
        setTools([]);
        setUsageLogs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadMcpData();
  }, []);

  useEffect(() => {
    if (!lastEvent) {
      return;
    }

    if (lastEvent.type === 'usage-logged') {
      const eventLog = lastEvent.newLog;
      const toolId = eventLog.toolId ?? eventLog.toolName ?? eventLog.id;
      const logEntry: GuiMcpUsageLog = {
        id: eventLog.id,
        toolId,
        toolName: eventLog.toolName ?? eventLog.toolId ?? 'Unknown Tool',
        agentId: eventLog.agentId,
        agentName: eventLog.agentId ?? lastEvent.clientName,
        action: eventLog.operation,
        timestamp: eventLog.timestamp,
        duration: eventLog.durationMs ?? 0,
        status: eventLog.status,
      };

      setUsageLogs((prev) => [logEntry, ...prev].slice(0, MAX_USAGE_LOGS));
      setTools((prev) => applyUsageLoggedEvent(prev, lastEvent));
      return;
    }

    if (lastEvent.type === 'metadata-updated') {
      setTools((prev) => applyMetadataUpdatedEvent(prev, lastEvent));
      return;
    }

    if (lastEvent.type === 'connection-changed') {
      setTools((prev) => applyConnectionChangedEvent(prev, lastEvent));
    }
  }, [lastEvent]);

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

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      if (ServiceContainer.has('mcp')) {
        const mcpService = ServiceContainer.getOrThrow('mcp');
        const mcpTools = await mcpService.getAllToolMetadata();
        const guiTools: GuiMcpTool[] = (mcpTools as Record<string, unknown>[]).map(mapRawMetadata);

        setTools(guiTools);
      }
      if (ServiceContainer.has('mcpUsageLog')) {
        const usageService = ServiceContainer.getOrThrow('mcpUsageLog');
        const logs = await usageService.getAllUsageLogs();
        setUsageLogs(normalizeUsageLogs(logs));
      }
    } catch (error) {
      console.error('Failed to refresh tools:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Empty state when no tools and not loading
  if (!isLoading && tools.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">MCP Tool Manager</h1>
            <p className="text-muted-foreground">
              No registered tools. Register a tool to get started.
            </p>
          </div>
          <Button variant="outline" className="gap-2" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        <Card className="p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <div>
              <h3 className="font-semibold">No tools found</h3>
              <p className="text-sm text-muted-foreground">
                Use the register dialog to add a tool, then connect it.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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

    if (minutes < 60) {
      return `${minutes}m ago`;
    }
    if (hours < 24) {
      return `${hours}h ago`;
    }
    return `${days}d ago`;
  };

  const statusDotClass = (status: 'success' | 'error' | string) => {
    if (status === 'success') {
      return 'bg-green-500';
    }
    if (status === 'error') {
      return 'bg-red-500';
    }
    return 'bg-yellow-500';
  };

  // Tool management handlers
  const handleConnectTool = async (toolId: string) => {
    try {
      if (ServiceContainer.has('mcp')) {
        const mcpService = ServiceContainer.getOrThrow('mcp');

        // Find the tool configuration
        const tool = tools.find((t) => t.id === toolId);
        if (tool) {
          // Create a basic MCP config for the tool
          const mcpConfig: McpConfig = {
            type: 'streamableHttp' as const,
            name: tool.name,
            version: tool.version,
            url: tool.endpoint || 'https://api.example.com/mcp',
          };

          // Connect the tool
          await mcpService.connectMcp(mcpConfig);

          // Update local state
          setTools((prev) =>
            prev.map((t) => (t.id === toolId ? { ...t, status: 'connected' } : t))
          );
        }
      }
    } catch (error) {
      console.error('Failed to connect tool:', error);
      // Update tool status to error
      setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, status: 'error' } : t)));
    }
  };

  const handleDisconnectTool = async (toolId: string) => {
    try {
      if (ServiceContainer.has('mcp')) {
        const mcpService = ServiceContainer.getOrThrow('mcp');

        // Disconnect the tool
        await mcpService.disconnectMcp(toolId);

        // Update local state
        setTools((prev) =>
          prev.map((t) => (t.id === toolId ? { ...t, status: 'disconnected' } : t))
        );
      }
    } catch (error) {
      console.error('Failed to disconnect tool:', error);
    }
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
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Tool
            </Button>
          </div>
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
                            className={`w-2 h-2 rounded-full ${statusDotClass(log.status)}`}
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
                                  onClick={() =>
                                    tool.status === 'connected'
                                      ? handleDisconnectTool(tool.id)
                                      : handleConnectTool(tool.id)
                                  }
                                >
                                  {tool.status === 'connected' && (
                                    <>
                                      <Unlink className="w-3 h-3 mr-1" />
                                      Disconnect
                                    </>
                                  )}
                                  {tool.status !== 'connected' && (
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
                                className={`w-3 h-3 rounded-full ${statusDotClass(log.status)}`}
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
