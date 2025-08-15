import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Cpu,
  DollarSign,
  Download,
  ExternalLink,
  MessageSquare,
  Package,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import type { LlmManifest } from 'llm-bridge-spec';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ServiceContainer } from '../../../shared/ipc/service-container';
import type { BridgeService } from '../../services/bridge.service';

// Model data types based on BridgeService
interface ModelInstance {
  id: string;
  name: string;
  provider: string;
  status: 'online' | 'offline' | 'error';
  endpoint: string;
  apiKey: string;
  capabilities: string[];
  usage: {
    requests: number;
    tokens: number;
    cost: number;
  };
  performance: {
    latency: number;
    uptime: number;
  };
  lastUsed: Date;
}

// Marketplace is deferred until a catalog is available

export function ModelManager() {
  const [activeTab, setActiveTab] = useState('instances');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modelInstances, setModelInstances] = useState<ModelInstance[]>([]);
  const [bridgeIds, setBridgeIds] = useState<string[]>([]);

  // Get BridgeService from ServiceContainer
  const bridgeService = ServiceContainer.getOrThrow('bridge');

  // Convert manifest capabilities to simple string labels used by UI
  const toCapabilityLabels = (manifest: LlmManifest): string[] => {
    const labels: string[] = [];
    const caps: any = manifest.capabilities as any;
    if (Array.isArray(caps?.modalities)) labels.push(...caps.modalities);
    if (caps?.supportsToolCall) labels.push('tool-call');
    if (caps?.supportsFunctionCall) labels.push('function-call');
    if (caps?.supportsMultiTurn) labels.push('multi-turn');
    if (caps?.supportsStreaming) labels.push('streaming');
    if (caps?.supportsVision) labels.push('vision');
    return Array.from(new Set(labels));
  };

  // Load bridge data on mount
  useEffect(() => {
    const loadBridges = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get available bridge IDs and current active bridge
        const ids = await bridgeService.getBridgeIds();
        setBridgeIds(ids);
        const current = await bridgeService.getCurrentBridge();

        // Build instances from manifests
        const instances: ModelInstance[] = [];
        for (const id of ids) {
          const manifest = await bridgeService.getBridgeConfig(id);
          if (!manifest) continue;
          instances.push({
            id,
            name: manifest.name,
            provider: manifest.language ?? id,
            status: current?.id === id ? 'online' : 'offline',
            endpoint: '',
            apiKey: '',
            capabilities: toCapabilityLabels(manifest),
            usage: { requests: 0, tokens: 0, cost: 0 },
            performance: { latency: 0, uptime: 0 },
            lastUsed: new Date(),
          });
        }
        setModelInstances(instances);
      } catch (err) {
        console.error('Failed to load bridge data:', err);
        setError('Failed to load model information');
        setModelInstances([]);
      } finally {
        setLoading(false);
      }
    };

    loadBridges();
  }, []);

  // const availableModels = [] as const; // placeholder

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const ids = await bridgeService.getBridgeIds();
      setBridgeIds(ids);
      const current = await bridgeService.getCurrentBridge();
      const instances: ModelInstance[] = [];
      for (const id of ids) {
        const manifest = await bridgeService.getBridgeConfig(id);
        if (!manifest) continue;
        instances.push({
          id,
          name: manifest.name,
          provider: manifest.language ?? id,
          status: current?.id === id ? 'online' : 'offline',
          endpoint: '',
          apiKey: '',
          capabilities: toCapabilityLabels(manifest),
          usage: { requests: 0, tokens: 0, cost: 0 },
          performance: { latency: 0, uptime: 0 },
          lastUsed: new Date(),
        });
      }
      setModelInstances(instances);
    } catch (err) {
      setError('Failed to refresh model data');
    } finally {
      setLoading(false);
    }
  };

  const handleInstallModel = async (modelId: string) => {
    try {
      // In real implementation, this would register a new bridge
      console.log('Installing model:', modelId);
      // await bridgeService.registerBridge(modelId, config);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to install model:', err);
    }
  };

  const handleSwitchModel = async (bridgeId: string) => {
    try {
      await bridgeService.switchBridge(bridgeId);
      await handleRefresh();
    } catch (err) {
      console.error('Failed to switch model:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600';
      case 'offline':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-600" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Model Manager</h1>
            <p className="text-muted-foreground">Loading AI model configurations...</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h1 className="text-2xl font-semibold">Model Manager</h1>
          <p className="text-muted-foreground">
            {error
              ? 'Model configuration error detected'
              : 'Manage AI model instances and configurations'}
          </p>
          {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Model
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="instances">Model Instances</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="instances" className="space-y-6">
          {/* Model Instances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {modelInstances.map((model) => (
              <Card key={model.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Cpu className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{model.name}</h3>
                      <p className="text-sm text-muted-foreground">{model.provider}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(model.status)}
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`font-semibold capitalize ${getStatusColor(model.status)}`}>
                      {model.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Requests</span>
                    <span className="font-semibold">{formatNumber(model.usage.requests)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens</span>
                    <span className="font-semibold">{formatNumber(model.usage.tokens)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cost</span>
                    <span className="font-semibold">{formatCurrency(model.usage.cost)}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Latency</span>
                    <span className="font-semibold">{model.performance.latency}s</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="font-semibold">{model.performance.uptime}%</span>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Capabilities</p>
                    <div className="flex flex-wrap gap-1">
                      {model.capabilities.map((capability) => (
                        <Badge key={capability} variant="secondary" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Button
                    size="sm"
                    className="flex-1"
                    variant={model.status === 'online' ? 'default' : 'outline'}
                    onClick={() => handleSwitchModel(model.id)}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    {model.status === 'online' ? 'Active' : 'Switch'}
                  </Button>
                  <Button variant="outline" size="sm">
                    <Settings className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="marketplace" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Package className="w-6 h-6 text-gray-600" />
              <div>
                <h3 className="font-semibold">Model Marketplace</h3>
                <p className="text-sm text-muted-foreground">
                  Catalog integration coming soon. Installed bridges are shown in the Instances tab.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {formatNumber(
                      modelInstances.reduce((sum, model) => sum + model.usage.requests, 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {formatNumber(
                      modelInstances.reduce((sum, model) => sum + model.usage.tokens, 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Tokens</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {formatCurrency(
                      modelInstances.reduce((sum, model) => sum + model.usage.cost, 0)
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Cost</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {(
                      modelInstances.reduce((sum, model) => sum + model.performance.uptime, 0) /
                      modelInstances.length
                    ).toFixed(1)}
                    %
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Uptime</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Performance Chart Placeholder */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
            <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Performance chart coming soon</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
