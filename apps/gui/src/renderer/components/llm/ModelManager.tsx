import type { LucideIcon } from 'lucide-react';
import {
  AlertCircle,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  Clock,
  DollarSign,
  Filter,
  PlugZap,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LlmManifest } from 'llm-bridge-spec';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { EmptyState } from '../layout/EmptyState';

export type ModelStatus = 'connected' | 'standby' | 'error' | 'paused';

export interface ModelManagerItem {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  capabilities: string[];
  status?: ModelStatus;
  language?: string;
  description?: string;
  tags?: string[];
  requestsPerHour?: number;
  costPerHourUsd?: number;
  avgLatencyMs?: number;
  lastUsedLabel?: string;
}

export interface ModelManagerProps {
  items: ModelManagerItem[];
  isLoading: boolean;
  onSwitch: (bridgeId: string) => Promise<void> | void;
  onRefresh: () => void;
  onRegister?: (manifest: LlmManifest) => Promise<void> | void;
  errorMessage?: string | null;
  onDismissError?: () => void;
}

interface MarketplaceBridge {
  name: string;
  version: string;
  description: string;
  author: string;
  downloads: number;
  language: string;
  capabilities: string[];
  tags: string[];
}

const MARKETPLACE_BRIDGES: MarketplaceBridge[] = [
  {
    name: 'Azure OpenAI Bridge',
    version: '1.2.0',
    description: 'Enterprise-grade OpenAI models with Azure governance.',
    author: 'Microsoft',
    downloads: 15420,
    language: 'C#',
    capabilities: ['text', 'vision', 'streaming'],
    tags: ['azure', 'enterprise', 'openai'],
  },
  {
    name: 'Hugging Face Inference Bridge',
    version: '0.9.0',
    description: 'Access thousands of community models via HF Inference.',
    author: 'Hugging Face',
    downloads: 8930,
    language: 'Python',
    capabilities: ['text', 'image', 'audio'],
    tags: ['huggingface', 'community'],
  },
  {
    name: 'AWS Bedrock Bridge',
    version: '1.0.0',
    description: 'Amazon Bedrock foundation models for regulated workloads.',
    author: 'AWS',
    downloads: 5670,
    language: 'TypeScript',
    capabilities: ['text', 'embedding'],
    tags: ['aws', 'bedrock'],
  },
  {
    name: 'Cohere Command Bridge',
    version: '0.8.0',
    description: 'Connect to Cohere’s command and embed models.',
    author: 'Cohere',
    downloads: 3240,
    language: 'Python',
    capabilities: ['text', 'embedding'],
    tags: ['cohere', 'classification'],
  },
];

const STATUS_META: Record<
  ModelStatus,
  {
    label: string;
    icon: LucideIcon;
    badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
    indicatorClass: string;
    iconClass: string;
    helper: string;
  }
> = {
  connected: {
    label: 'Connected',
    icon: CheckCircle2,
    badgeVariant: 'default',
    indicatorClass: 'bg-emerald-100',
    iconClass: 'text-emerald-600',
    helper: 'Active and routing traffic.',
  },
  standby: {
    label: 'Standby',
    icon: Wifi,
    badgeVariant: 'outline',
    indicatorClass: 'bg-muted',
    iconClass: 'text-muted-foreground',
    helper: 'Ready to activate when needed.',
  },
  error: {
    label: 'Error',
    icon: AlertTriangle,
    badgeVariant: 'destructive',
    indicatorClass: 'bg-destructive/10',
    iconClass: 'text-destructive',
    helper: 'Action required – review logs.',
  },
  paused: {
    label: 'Paused',
    icon: WifiOff,
    badgeVariant: 'secondary',
    indicatorClass: 'bg-amber-100',
    iconClass: 'text-amber-600',
    helper: 'Temporarily stopped. Resume to reactivate.',
  },
};

const LANGUAGE_TONES: Record<string, string> = {
  typescript: 'bg-blue-100 text-blue-700',
  javascript: 'bg-yellow-100 text-yellow-700',
  python: 'bg-emerald-100 text-emerald-700',
  'c#': 'bg-purple-100 text-purple-700',
};

const deriveStatus = (item: ModelManagerItem): ModelStatus => {
  if (item.status) {
    return item.status;
  }
  return item.isActive ? 'connected' : 'standby';
};

if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverPolyfill {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }

  (
    globalThis as typeof globalThis & {
      ResizeObserver: typeof ResizeObserverPolyfill;
    }
  ).ResizeObserver = ResizeObserverPolyfill;
}

const formatCurrency = (value: number | undefined, hasData: boolean) => {
  if (!hasData) {
    return '—';
  }
  if (!value) {
    return '$0.00';
  }
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatLatency = (value: number | undefined, hasData: boolean) => {
  if (!hasData || typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value)}ms`;
};

const formatRequests = (value: number | undefined, hasData: boolean) => {
  if (!hasData) {
    return '—';
  }
  return value ? value.toLocaleString() : '0';
};

export function ModelManager({
  items,
  isLoading,
  onRefresh,
  onSwitch,
  onRegister,
  errorMessage,
  onDismissError,
}: ModelManagerProps) {
  const [activeTab, setActiveTab] = useState<'instances' | 'bridges' | 'marketplace'>('instances');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setRegisterOpen] = useState(false);
  const [manifestText, setManifestText] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return items;
    }

    return items.filter((item) => {
      const inName = item.name.toLowerCase().includes(query);
      const inProvider = item.provider.toLowerCase().includes(query);
      const inCapabilities = item.capabilities.some((capability) =>
        capability.toLowerCase().includes(query)
      );
      return inName || inProvider || inCapabilities;
    });
  }, [items, searchQuery]);

  const summaryMetrics = useMemo(() => {
    const activeCount = items.filter((item) => deriveStatus(item) === 'connected').length;
    const hasRequests = items.some((item) => typeof item.requestsPerHour === 'number');
    const totalRequests = items.reduce((acc, item) => acc + (item.requestsPerHour ?? 0), 0);
    const hasCost = items.some((item) => typeof item.costPerHourUsd === 'number');
    const totalCost = items.reduce((acc, item) => acc + (item.costPerHourUsd ?? 0), 0);
    const latencies = items
      .map((item) => item.avgLatencyMs)
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
    const averageLatency = latencies.length
      ? latencies.reduce((acc, value) => acc + value, 0) / latencies.length
      : undefined;

    return [
      {
        label: 'Active Instances',
        value: activeCount.toString(),
        icon: CheckCircle2,
        accent: 'bg-emerald-100 text-emerald-600',
      },
      {
        label: 'Requests / hr',
        value: formatRequests(totalRequests, hasRequests),
        icon: BarChart3,
        accent: 'bg-blue-100 text-blue-600',
      },
      {
        label: 'Cost / hr',
        value: formatCurrency(totalCost, hasCost),
        icon: DollarSign,
        accent: 'bg-purple-100 text-purple-600',
      },
      {
        label: 'Avg Latency',
        value: formatLatency(averageLatency, latencies.length > 0),
        icon: Clock,
        accent: 'bg-orange-100 text-orange-600',
      },
    ];
  }, [items]);

  const capabilityMeta = useMemo(() => {
    const total = items.length;
    const capabilitySet = new Set<string>();
    items.forEach((item) => {
      item.capabilities.forEach((capability) => {
        capabilitySet.add(capability);
      });
    });

    return {
      total,
      unique: capabilitySet.size,
      coverage: total > 0 ? Math.min(Math.round((capabilitySet.size / total) * 100), 100) : 0,
    };
  }, [items]);

  const handleOpenRegister = () => {
    setSubmitError(null);
    setManifestText('');
    setRegisterOpen(true);
  };

  const handleSubmitRegister = async () => {
    setSubmitError(null);
    try {
      const parsed = JSON.parse(manifestText) as LlmManifest;
      if (!parsed || typeof parsed !== 'object' || !('name' in parsed)) {
        throw new Error('Invalid manifest: missing required fields.');
      }
      await onRegister?.(parsed);
      setRegisterOpen(false);
      onRefresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to parse manifest.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">LLM Bridges</h1>
            <p className="text-muted-foreground">Loading model configurations…</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Syncing</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`metric-skeleton-${index}`} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-1/3" />
              <div className="h-8 bg-muted rounded w-1/2" />
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`bridge-skeleton-${index}`} className="p-6 space-y-4 animate-pulse">
              <div className="h-5 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-4/5" />
              <div className="h-3 bg-muted rounded w-3/5" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 border-b bg-muted/10">
        <div className="p-6 space-y-4">
          {errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Bridge operation failed</AlertTitle>
              <AlertDescription className="flex items-center justify-between gap-4">
                <span>{errorMessage}</span>
                <Button variant="outline" size="sm" onClick={onDismissError}>
                  Dismiss
                </Button>
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold">LLM Bridges</h1>
            <p className="text-muted-foreground">
              Manage installed bridges, switch active models, and explore marketplace options.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {summaryMetrics.map(({ label, value, icon: Icon, accent }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-lg font-semibold text-foreground">{value}</p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as typeof activeTab)}
        className="flex-1 min-h-0 flex flex-col"
      >
        <div className="flex-shrink-0 px-6 pt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="instances">Model Instances</TabsTrigger>
            <TabsTrigger value="bridges">Installed Bridges</TabsTrigger>
            <TabsTrigger value="marketplace">Bridge Marketplace</TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 min-h-0 px-6 pb-6">
          <ScrollArea className="h-full">
            <div className="space-y-6 py-4">
              <TabsContent value="instances" className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bridges or capabilities..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs uppercase tracking-wide">
                      {capabilityMeta.unique} capabilities • {capabilityMeta.coverage}% coverage
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
                      <RefreshCw className="w-4 h-4" /> Refresh
                    </Button>
                    <Button size="sm" className="gap-2" onClick={handleOpenRegister}>
                      <Plus className="w-4 h-4" /> Add Model
                    </Button>
                  </div>
                </div>

                {filteredItems.length === 0 && (
                  <div className="flex-1 min-h-0 flex items-center justify-center">
                    <div className="max-w-lg w-full">
                      <EmptyState
                        type="models"
                        title="No matching bridges"
                        description="조금 더 넓은 검색어를 사용하거나 새 브리지를 등록해보세요."
                        actionLabel="Open Register"
                        onAction={handleOpenRegister}
                        secondaryAction={{
                          label: 'Clear search',
                          onClick: () => setSearchQuery(''),
                        }}
                      />
                    </div>
                  </div>
                )}

                {filteredItems.length > 0 && (
                  <div className="space-y-4">
                    {filteredItems.map((item) => {
                      const status = deriveStatus(item);
                      const statusMeta = STATUS_META[status];
                      const StatusIcon = statusMeta.icon;
                      const language = (item.language ?? item.provider ?? '').toLowerCase();
                      const languageTone =
                        LANGUAGE_TONES[language] ?? 'bg-muted text-muted-foreground';
                      const hasRequests = typeof item.requestsPerHour === 'number';
                      const hasCost = typeof item.costPerHourUsd === 'number';
                      const hasLatency = typeof item.avgLatencyMs === 'number';
                      const indicatorClasses = `w-10 h-10 rounded-lg flex items-center justify-center ${statusMeta.indicatorClass}`;

                      return (
                        <Card key={item.id} className="p-6 space-y-4">
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div className="flex items-start gap-3">
                              <div className={indicatorClasses}>
                                <StatusIcon className={`w-5 h-5 ${statusMeta.iconClass}`} />
                              </div>
                              <div>
                                <h3 className="font-semibold text-foreground">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">{item.provider}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={statusMeta.badgeVariant} className="gap-1 capitalize">
                                <StatusIcon className="w-3 h-3" />
                                {statusMeta.label}
                              </Badge>
                              <Badge variant="outline" className={`text-xs ${languageTone}`}>
                                {item.language ?? item.provider}
                              </Badge>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div>
                              <p className="text-muted-foreground">Requests / hr</p>
                              <p className="font-semibold">
                                {formatRequests(item.requestsPerHour, hasRequests)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Cost / hr</p>
                              <p className="font-semibold">
                                {formatCurrency(item.costPerHourUsd, hasCost)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Avg latency</p>
                              <p className="font-semibold">
                                {formatLatency(item.avgLatencyMs, hasLatency)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Last used</p>
                              <p className="font-semibold">{item.lastUsedLabel ?? '—'}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {item.capabilities.length > 0 &&
                              item.capabilities.map((capability) => (
                                <Badge
                                  key={`${item.id}-${capability}`}
                                  variant="outline"
                                  className="text-xs uppercase tracking-wide"
                                >
                                  {capability}
                                </Badge>
                              ))}
                            {item.capabilities.length === 0 && (
                              <Badge variant="outline" className="text-xs text-muted-foreground">
                                No capabilities reported
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between md:pt-2 md:border-t">
                            <span className="text-xs text-muted-foreground">
                              {statusMeta.helper}
                            </span>
                            {status === 'connected' && (
                              <Button variant="outline" size="sm" disabled className="gap-2">
                                <BadgeCheck className="w-4 h-4" /> Active
                              </Button>
                            )}
                            {status !== 'connected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => onSwitch(item.id)}
                              >
                                <PlugZap className="w-4 h-4" /> Activate
                              </Button>
                            )}
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}

                <Card className="p-6">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Create new model instance</h3>
                      <p className="text-sm text-muted-foreground">
                        설치된 브릿지 또는 신규 매니페스트 등록으로 모델 인스턴스를 추가하세요.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh}>
                        <RefreshCw className="w-4 h-4" /> Refresh list
                      </Button>
                      <Button size="sm" className="gap-2" onClick={handleOpenRegister}>
                        <Plus className="w-4 h-4" /> Register manifest
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="bridges" className="space-y-4">
                {items.length === 0 && (
                  <Card className="p-10">
                    <div className="flex flex-col items-center text-center space-y-3">
                      <AlertTriangle className="w-8 h-8 text-muted-foreground" />
                      <h3 className="text-lg font-semibold text-foreground">
                        No bridges installed
                      </h3>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Register an LLM bridge manifest to connect AgentOS with external providers.
                      </p>
                      <Button onClick={handleOpenRegister} className="gap-2">
                        <Plus className="w-4 h-4" /> Register Bridge
                      </Button>
                    </div>
                  </Card>
                )}

                {items.length > 0 &&
                  items.map((item) => {
                    const status = deriveStatus(item);
                    const statusMeta = STATUS_META[status];
                    const StatusIcon = statusMeta.icon;
                    const language = (item.language ?? item.provider ?? '').toLowerCase();
                    const languageTone =
                      LANGUAGE_TONES[language] ?? 'bg-muted text-muted-foreground';

                    return (
                      <Card key={`${item.id}-bridge`} className="p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-lg">{item.name}</CardTitle>
                              <Badge variant="outline" className={`text-xs ${languageTone}`}>
                                {item.language ?? item.provider}
                              </Badge>
                              <Badge variant={statusMeta.badgeVariant} className="gap-1 capitalize">
                                <StatusIcon className="w-3 h-3" />
                                {statusMeta.label}
                              </Badge>
                            </div>
                            {item.description && (
                              <CardDescription className="text-sm text-muted-foreground">
                                {item.description}
                              </CardDescription>
                            )}
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {item.tags.map((tag) => (
                                  <Badge
                                    key={`${item.id}-${tag}`}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="gap-2">
                              <Settings className="w-4 h-4" /> Configure
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2">
                              <BarChart3 className="w-4 h-4" /> Stats
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          {item.capabilities.length > 0 &&
                            item.capabilities.map((capability) => (
                              <Badge
                                key={`${item.id}-${capability}-installed`}
                                variant="outline"
                                className="text-xs uppercase tracking-wide"
                              >
                                {capability}
                              </Badge>
                            ))}
                          {item.capabilities.length === 0 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              No capabilities reported
                            </Badge>
                          )}
                        </div>
                      </Card>
                    );
                  })}
              </TabsContent>

              <TabsContent value="marketplace" className="space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="relative w-full lg:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Search marketplace bridges..." className="pl-9" />
                  </div>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" /> Filter
                  </Button>
                </div>

                {MARKETPLACE_BRIDGES.map((bridge) => (
                  <Card key={bridge.name} className="p-6">
                    <CardHeader className="p-0 pb-4">
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                        <div>
                          <CardTitle>{bridge.name}</CardTitle>
                          <CardDescription>
                            {bridge.author} · v{bridge.version}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <BarChart3 className="w-3 h-3" /> {bridge.downloads.toLocaleString()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 space-y-4">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {bridge.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {bridge.capabilities.map((capability) => (
                          <Badge
                            key={`${bridge.name}-${capability}`}
                            variant="outline"
                            className="text-xs uppercase tracking-wide"
                          >
                            {capability}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bridge.tags.map((tag) => (
                          <Badge key={`${bridge.name}-${tag}`} className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          Runtime: {bridge.language}
                        </span>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" /> Install
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </div>
          </ScrollArea>
        </div>
      </Tabs>

      <Dialog open={isRegisterOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Register LLM bridge manifest</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Paste the bridge manifest JSON to register a new model bridge. AgentOS validates the
              schema before installation.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={manifestText}
              onChange={(event) => setManifestText(event.target.value)}
              rows={10}
              placeholder='{"name": "My Bridge", "entry": "./index.ts", ...}'
            />
            {submitError && (
              <Alert variant="destructive" className="text-sm">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between sm:gap-0">
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRegister} className="gap-2">
              <Plus className="w-4 h-4" /> Register Bridge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ModelManager;
