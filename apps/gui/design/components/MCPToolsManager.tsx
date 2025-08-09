import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Skeleton } from './ui/skeleton';
import { Alert, AlertDescription } from './ui/alert';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Code,
  Database,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
  Wrench,
  Zap,
  BarChart3,
  Calendar,
  Filter,
  Download,
  Upload,
  Link,
  Unlink,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  TrendingUp,
  Terminal,
  Wifi,
  Sparkles,
  Package,
  Cpu,
  Network,
  Palette,
  Brain,
  GitBranch,
} from 'lucide-react';

interface BuiltinTool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'enabled' | 'disabled';
  version: string;
  provider: 'AgentOS Built-in';
  capabilities: string[];
  icon: React.ReactNode;
  usageCount: number;
  lastUsed?: Date;
  isCore: boolean; // Core tools cannot be disabled
}

interface MCPTool {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  version: string;
  provider: string;
  lastUsed?: Date;
  usageCount: number;
  endpoint?: string;
  apiKey?: string;
  permissions: string[];
  icon: React.ReactNode;
  config?: any;
  protocol: 'stdio' | 'streamableHttp' | 'websocket' | 'sse';
}

interface ToolUsageLog {
  id: string;
  toolId: string;
  toolName: string;
  toolType: 'builtin' | 'mcp';
  agentId: string;
  agentName: string;
  action: string;
  timestamp: Date;
  duration: number;
  status: 'success' | 'error' | 'timeout';
  parameters?: Record<string, any>;
  result?: string;
}

interface MCPToolsManagerProps {
  onCreateTool: () => void;
}

export function MCPToolsManager({ onCreateTool }: MCPToolsManagerProps) {
  const [activeTab, setActiveTab] = useState('builtin');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [builtinTools, setBuiltinTools] = useState<BuiltinTool[]>([]);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [usageLogs, setUsageLogs] = useState<ToolUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data initialization
  useEffect(() => {
    const timer = setTimeout(() => {
      const mockBuiltinTools: BuiltinTool[] = [
        {
          id: 'web-search-builtin',
          name: 'Web Search',
          description:
            'Search the web for current information and news using built-in search capabilities',
          category: 'search',
          status: 'enabled',
          version: '1.0.0',
          provider: 'AgentOS Built-in',
          capabilities: ['realtime-search', 'content-extraction', 'fact-checking'],
          icon: <Globe className="w-5 h-5" />,
          usageCount: 245,
          lastUsed: new Date(Date.now() - 1000 * 60 * 30),
          isCore: true,
        },
        {
          id: 'code-executor-builtin',
          name: 'Code Execution',
          description:
            'Execute Python, JavaScript, and other code snippets in a secure sandbox environment',
          category: 'development',
          status: 'enabled',
          version: '2.1.0',
          provider: 'AgentOS Built-in',
          capabilities: ['python', 'javascript', 'bash', 'sandboxed-execution'],
          icon: <Code className="w-5 h-5" />,
          usageCount: 189,
          lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 2),
          isCore: true,
        },
        {
          id: 'image-generator-builtin',
          name: 'Image Generation',
          description: 'Generate images from text descriptions using integrated AI models',
          category: 'creative',
          status: 'enabled',
          version: '1.5.0',
          provider: 'AgentOS Built-in',
          capabilities: ['text-to-image', 'style-transfer', 'image-editing'],
          icon: <ImageIcon className="w-5 h-5" />,
          usageCount: 156,
          lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 4),
          isCore: false,
        },
        {
          id: 'file-processor-builtin',
          name: 'File Processing',
          description: 'Process and analyze various file formats including PDF, DOC, CSV, and more',
          category: 'productivity',
          status: 'enabled',
          version: '1.3.0',
          provider: 'AgentOS Built-in',
          capabilities: ['pdf-parsing', 'document-analysis', 'data-extraction'],
          icon: <FileText className="w-5 h-5" />,
          usageCount: 134,
          lastUsed: new Date(Date.now() - 1000 * 60 * 15),
          isCore: false,
        },
        {
          id: 'data-viz-builtin',
          name: 'Data Visualization',
          description: 'Create charts, graphs, and visual representations of data',
          category: 'analytics',
          status: 'disabled',
          version: '1.2.0',
          provider: 'AgentOS Built-in',
          capabilities: ['chart-generation', 'data-analysis', 'statistical-plots'],
          icon: <BarChart3 className="w-5 h-5" />,
          usageCount: 67,
          lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          isCore: false,
        },
        {
          id: 'knowledge-search-builtin',
          name: 'Knowledge Search',
          description: 'Search through uploaded documents and knowledge base',
          category: 'search',
          status: 'enabled',
          version: '1.1.0',
          provider: 'AgentOS Built-in',
          capabilities: ['semantic-search', 'document-retrieval', 'context-matching'],
          icon: <Brain className="w-5 h-5" />,
          usageCount: 89,
          lastUsed: new Date(Date.now() - 1000 * 60 * 45),
          isCore: true,
        },
      ];

      const mockMcpTools: MCPTool[] = [
        {
          id: 'arxiv-search-mcp',
          name: 'ArXiv Search (MCP)',
          description: 'Search academic papers on ArXiv using MCP protocol',
          category: 'mcp',
          status: 'connected',
          version: '1.0.0',
          provider: 'External MCP Server',
          lastUsed: new Date(Date.now() - 1000 * 60 * 45),
          usageCount: 78,
          permissions: ['search', 'read'],
          icon: <Terminal className="w-5 h-5" />,
          protocol: 'stdio',
          config: {
            type: 'stdio',
            name: 'arxiv-search',
            version: '1.0.0',
            command: 'node',
            args: ['/opt/mcp-tools/arxiv-server.js'],
            env: { API_KEY: 'demo' },
          },
        },
        {
          id: 'github-api-mcp',
          name: 'GitHub API (MCP)',
          description: 'GitHub repository and issue management via MCP protocol',
          category: 'mcp',
          status: 'connected',
          version: '2.1.0',
          provider: 'External MCP Server',
          lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 3),
          usageCount: 92,
          permissions: ['read', 'write'],
          icon: <GitBranch className="w-5 h-5" />,
          protocol: 'streamableHttp',
          config: {
            type: 'streamableHttp',
            name: 'github-api',
            version: '2.1.0',
            url: 'https://api.github.com/mcp',
            headers: { Authorization: 'Bearer demo-token' },
          },
        },
        {
          id: 'database-mcp',
          name: 'Database Connector (MCP)',
          description: 'Connect to external databases via MCP protocol',
          category: 'mcp',
          status: 'error',
          version: '1.3.0',
          provider: 'External MCP Server',
          lastUsed: new Date(Date.now() - 1000 * 60 * 60 * 24),
          usageCount: 34,
          permissions: ['read', 'write', 'admin'],
          icon: <Database className="w-5 h-5" />,
          protocol: 'websocket',
          config: {
            type: 'websocket',
            name: 'postgres-connector',
            version: '1.3.0',
            url: 'ws://localhost:8080/db-mcp',
          },
        },
      ];

      const mockLogs: ToolUsageLog[] = [
        {
          id: 'log-1',
          toolId: 'web-search-builtin',
          toolName: 'Web Search',
          toolType: 'builtin',
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
          toolId: 'code-executor-builtin',
          toolName: 'Code Execution',
          toolType: 'builtin',
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
          toolId: 'arxiv-search-mcp',
          toolName: 'ArXiv Search (MCP)',
          toolType: 'mcp',
          agentId: 'agent-1',
          agentName: 'Research Assistant',
          action: 'search',
          timestamp: new Date(Date.now() - 1000 * 60 * 45),
          duration: 1890,
          status: 'success',
          parameters: { query: 'transformer neural networks' },
        },
        {
          id: 'log-4',
          toolId: 'github-api-mcp',
          toolName: 'GitHub API (MCP)',
          toolType: 'mcp',
          agentId: 'agent-2',
          agentName: 'Code Assistant',
          action: 'create_issue',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
          duration: 3200,
          status: 'success',
          parameters: { repo: 'test/repo', title: 'Bug fix needed' },
        },
      ];

      setBuiltinTools(mockBuiltinTools);
      setMcpTools(mockMcpTools);
      setUsageLogs(mockLogs);
      setIsLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  // Calculate categories safely
  const builtinCategories = [
    { id: 'all', label: 'All Categories', count: builtinTools?.length || 0 },
    {
      id: 'search',
      label: 'Search',
      count: builtinTools?.filter((t) => t.category === 'search').length || 0,
    },
    {
      id: 'development',
      label: 'Development',
      count: builtinTools?.filter((t) => t.category === 'development').length || 0,
    },
    {
      id: 'creative',
      label: 'Creative',
      count: builtinTools?.filter((t) => t.category === 'creative').length || 0,
    },
    {
      id: 'productivity',
      label: 'Productivity',
      count: builtinTools?.filter((t) => t.category === 'productivity').length || 0,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      count: builtinTools?.filter((t) => t.category === 'analytics').length || 0,
    },
  ];

  const mcpCategories = [
    { id: 'all', label: 'All Categories', count: mcpTools?.length || 0 },
    { id: 'mcp', label: 'MCP Tools', count: mcpTools?.length || 0 },
  ];

  const currentCategories = activeTab === 'builtin' ? builtinCategories : mcpCategories;
  const currentTools = activeTab === 'builtin' ? builtinTools : mcpTools;

  const filteredTools = (currentTools || []).filter((tool) => {
    const matchesSearch =
      tool?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tool?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getStatusIcon = (status: string, isBuiltin: boolean = false) => {
    if (isBuiltin) {
      switch (status) {
        case 'enabled':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'disabled':
          return <AlertCircle className="w-4 h-4 text-gray-400" />;
        default:
          return <AlertCircle className="w-4 h-4 text-gray-400" />;
      }
    } else {
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
    }
  };

  const getStatusBadge = (status: string, isBuiltin: boolean = false) => {
    if (isBuiltin) {
      const variants = {
        enabled: 'default',
        disabled: 'secondary',
      } as const;

      return (
        <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      );
    } else {
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
    }
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

  const enabledBuiltinTools = (builtinTools || []).filter((t) => t.status === 'enabled').length;
  const connectedMcpTools = (mcpTools || []).filter((t) => t.status === 'connected').length;
  const errorMcpTools = (mcpTools || []).filter((t) => t.status === 'error').length;
  const totalUsage = [...(builtinTools || []), ...(mcpTools || [])].reduce(
    (sum, tool) => sum + (tool?.usageCount || 0),
    0
  );

  const toggleBuiltinTool = (toolId: string) => {
    setBuiltinTools((prev) =>
      (prev || []).map((tool) =>
        tool.id === toolId
          ? {
              ...tool,
              status:
                tool.status === 'enabled' ? 'disabled' : ('enabled' as 'enabled' | 'disabled'),
            }
          : tool
      )
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg flex items-center justify-center">
              <div className="text-purple-600">
                <Wrench className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tools</h1>
              <p className="text-muted-foreground">
                Manage built-in tools and external MCP integrations
              </p>
            </div>
          </div>

          <Button onClick={onCreateTool} className="gap-2">
            <Plus className="w-4 h-4" />
            Create MCP Tool
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{enabledBuiltinTools}</p>
                <p className="text-sm text-muted-foreground">Built-in Enabled</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Network className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{connectedMcpTools}</p>
                <p className="text-sm text-muted-foreground">MCP Connected</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{errorMcpTools}</p>
                <p className="text-sm text-muted-foreground">MCP Errors</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalUsage}</p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="builtin" className="gap-2">
                <Package className="w-4 h-4" />
                Built-in Tools
              </TabsTrigger>
              <TabsTrigger value="mcp" className="gap-2">
                <Network className="w-4 h-4" />
                MCP Tools
              </TabsTrigger>
              <TabsTrigger value="usage" className="gap-2">
                <Activity className="w-4 h-4" />
                Usage Logs
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="builtin" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                {/* Info Alert */}
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Built-in tools are provided by AgentOS and run securely within the platform.
                    They require no external configuration and can be easily enabled or disabled.
                  </AlertDescription>
                </Alert>

                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search built-in tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="flex gap-1">
                    {(currentCategories || []).map((category) => (
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
                        : filteredTools.map((tool) => {
                            const builtinTool = tool as BuiltinTool;
                            return (
                              <Card key={tool.id} className="p-6 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                      {tool.icon}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-foreground">{tool.name}</h3>
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm text-muted-foreground">
                                          {tool.provider}
                                        </p>
                                        {builtinTool.isCore && (
                                          <Badge variant="outline" className="text-xs">
                                            Core
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(tool.status, true)}
                                    {getStatusBadge(tool.status, true)}
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
                                  {tool.lastUsed && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Last used:</span>
                                      <span className="font-medium text-foreground">
                                        {formatTimeAgo(tool.lastUsed)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Capabilities:</span>
                                    <span className="font-medium text-foreground">
                                      {builtinTool.capabilities?.length || 0}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Capabilities:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(builtinTool.capabilities || [])
                                        .slice(0, 3)
                                        .map((capability, index) => (
                                          <Badge key={index} variant="outline" className="text-xs">
                                            {capability}
                                          </Badge>
                                        ))}
                                      {(builtinTool.capabilities?.length || 0) > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                          +{(builtinTool.capabilities?.length || 0) - 3} more
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Switch
                                        checked={builtinTool.status === 'enabled'}
                                        onCheckedChange={() => toggleBuiltinTool(tool.id)}
                                        disabled={builtinTool.isCore}
                                      />
                                      <span className="text-sm">
                                        {builtinTool.isCore ? 'Always Active' : 'Enable Tool'}
                                      </span>
                                    </div>
                                    <Button variant="outline" size="sm">
                                      <Settings className="w-3 h-3 mr-1" />
                                      Configure
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            );
                          })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="mcp" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                {/* Info Alert */}
                <Alert>
                  <Network className="w-4 h-4" />
                  <AlertDescription>
                    MCP (Model Context Protocol) tools are external integrations that extend agent
                    capabilities. They require configuration and may need authentication or network
                    access.
                  </AlertDescription>
                </Alert>

                {/* Filters */}
                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search MCP tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
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

                {/* Tools Grid */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {isLoading
                        ? Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="p-6">
                              <Skeleton className="w-full h-32" />
                            </Card>
                          ))
                        : filteredTools.map((tool) => {
                            const mcpTool = tool as MCPTool;
                            return (
                              <Card
                                key={tool.id}
                                className="p-6 hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                      {tool.icon}
                                    </div>
                                    <div>
                                      <h3 className="font-medium text-foreground">{tool.name}</h3>
                                      <div className="flex items-center gap-1">
                                        <p className="text-sm text-muted-foreground">
                                          {tool.provider}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                          {mcpTool.protocol}
                                        </Badge>
                                      </div>
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
                                  {tool.lastUsed && (
                                    <div className="flex justify-between text-sm">
                                      <span className="text-muted-foreground">Last used:</span>
                                      <span className="font-medium text-foreground">
                                        {formatTimeAgo(tool.lastUsed)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Protocol:</span>
                                    <span className="font-medium text-foreground font-mono text-xs">
                                      {mcpTool.protocol}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-2">
                                      Permissions:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                      {(mcpTool.permissions || []).map((permission, index) => (
                                        <Badge key={index} variant="secondary" className="text-xs">
                                          {permission}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" className="flex-1">
                                      <Settings className="w-3 h-3 mr-1" />
                                      Configure
                                    </Button>
                                    <Button
                                      variant={
                                        mcpTool.status === 'connected' ? 'destructive' : 'default'
                                      }
                                      size="sm"
                                    >
                                      {mcpTool.status === 'connected' ? (
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
                                </div>
                              </Card>
                            );
                          })}
                    </div>

                    {/* Empty state for MCP tools */}
                    {!isLoading && (mcpTools || []).length === 0 && (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Network className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          No MCP Tools Yet
                        </h3>
                        <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                          Create your first MCP tool to extend agent capabilities with external
                          services and APIs.
                        </p>
                        <Button onClick={onCreateTool} className="gap-2">
                          <Plus className="w-4 h-4" />
                          Create First MCP Tool
                        </Button>
                      </div>
                    )}
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
                      {(usageLogs || []).map((log) => (
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
                              <div className="flex items-center gap-2">
                                {log.toolType === 'builtin' ? (
                                  <Package className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Network className="w-4 h-4 text-purple-600" />
                                )}
                                <Badge variant="outline" className="text-xs">
                                  {log.toolType === 'builtin' ? 'Built-in' : 'MCP'}
                                </Badge>
                              </div>
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
          </div>
        </Tabs>
      </div>
    </div>
  );
}
