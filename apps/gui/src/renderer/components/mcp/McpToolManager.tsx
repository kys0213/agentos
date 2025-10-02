import type { LucideIcon } from 'lucide-react';
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
  Search,
  Settings,
  Sparkles,
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
import type { McpCreationStep } from '../../stores/store-types';
import { EmptyState } from '../layout/EmptyState';

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

interface MCPToolsManagerProps {
  onCreateTool?: (step?: McpCreationStep) => void;
  forceEmptyState?: boolean;
  onToggleEmptyState?: () => void;
}

export function MCPToolsManager({
  onCreateTool,
  forceEmptyState = false,
  onToggleEmptyState,
}: MCPToolsManagerProps) {
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
  const shouldShowEmptyState = forceEmptyState || (!isLoading && tools.length === 0);

  if (shouldShowEmptyState) {
    const handlePrimaryAction = () => {
      if (onCreateTool) {
        onCreateTool();
        return;
      }
      if (onToggleEmptyState) {
        onToggleEmptyState();
        return;
      }
      void handleRefresh();
    };

    const showDemoEmptyState = forceEmptyState && tools.length > 0;

    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="max-w-lg w-full">
          <EmptyState
            type="tools"
            title={showDemoEmptyState ? 'No tools to display' : 'No MCP tools yet'}
            description="Register your first MCP tool to connect external capabilities."
            actionLabel={onCreateTool ? 'Register Tool' : 'Reload Tools'}
            onAction={handlePrimaryAction}
            secondaryAction={
              showDemoEmptyState && onToggleEmptyState
                ? {
                    label: 'Show Tools',
                    onClick: onToggleEmptyState,
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-4 h-4 text-status-active" />;
      case 'disconnected':
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-status-error" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-status-idle" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      connected: 'status-active-subtle',
      pending: 'status-idle-subtle',
      disconnected: 'status-inactive-subtle',
      error: 'status-error-subtle',
    };

    return (
      <Badge variant="outline" className={`gap-1 ${classes[status] ?? 'status-idle-subtle'}`}>
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
      return 'bg-status-active';
    }
    if (status === 'error') {
      return 'bg-status-error';
    }
    return 'bg-status-idle';
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
  const pendingTools = tools.filter((t) => t.status === 'pending').length;
  const disconnectedTools = tools.filter((t) => t.status === 'disconnected').length;
  const errorTools = tools.filter((t) => t.status === 'error').length;
  const totalTools = tools.length;
  const connectivityPercent = totalTools > 0 ? Math.round((connectedTools / totalTools) * 100) : 0;
  const pendingPercent = totalTools > 0 ? Math.round((pendingTools / totalTools) * 100) : 0;
  const disconnectedPercent =
    totalTools > 0 ? Math.round((disconnectedTools / totalTools) * 100) : 0;
  const errorPercent = totalTools > 0 ? Math.round((errorTools / totalTools) * 100) : 0;

  const statusMetrics: Array<{
    id: 'connected' | 'pending' | 'disconnected' | 'error';
    label: string;
    value: number;
    percent: number;
    Icon: LucideIcon;
    barClass: string;
    helper: string;
  }> = [
    {
      id: 'connected',
      label: 'Connected',
      value: connectedTools,
      percent: connectivityPercent,
      Icon: CheckCircle,
      barClass: 'bg-status-active',
      helper: 'Active sessions',
    },
    {
      id: 'pending',
      label: 'Pending',
      value: pendingTools,
      percent: pendingPercent,
      Icon: Clock,
      barClass: 'bg-status-idle',
      helper: 'Awaiting verification',
    },
    {
      id: 'disconnected',
      label: 'Disconnected',
      value: disconnectedTools,
      percent: disconnectedPercent,
      Icon: Unlink,
      barClass: 'bg-status-inactive',
      helper: 'Manual connection required',
    },
    {
      id: 'error',
      label: 'Errors',
      value: errorTools,
      percent: errorPercent,
      Icon: AlertTriangle,
      barClass: 'bg-status-error',
      helper: 'Action needed',
    },
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
              <Wrench className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tool Manager</h1>
              <p className="text-sm text-muted-foreground">
                Connect external capabilities through the Model Context Protocol
              </p>
            </div>
          </div>
          {onCreateTool && (
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">Extend agent skills</p>
                <p className="text-xs text-muted-foreground">Register new MCP tools instantly</p>
              </div>
              <Button
                onClick={() => onCreateTool('overview')}
                className="gap-2 relative overflow-hidden group bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                size="lg"
              >
                <div className="relative z-10 flex items-center gap-2">
                  <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-foreground/20">
                    <Plus className="w-3 h-3" />
                  </div>
                  <span className="font-medium">Create MCP Tool</span>
                  <Sparkles className="w-4 h-4 opacity-80" />
                </div>
                <div className="absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/20 to-primary-foreground/0 transition-transform duration-700 group-hover:translate-x-[110%]" />
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statusMetrics.map(({ id, label, value, percent, Icon, barClass, helper }) => (
            <Card key={id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {percent}%
                </Badge>
              </div>
              <p className="mt-3 text-2xl font-semibold text-foreground">
                {value.toLocaleString()}
              </p>
              <div className="mt-3 h-2 rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${barClass}`}
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
            </Card>
          ))}
        </div>
      </div>

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
