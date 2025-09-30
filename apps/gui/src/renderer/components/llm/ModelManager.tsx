import { AlertCircle, Cpu, Package, Plus, RefreshCw, Search, Wifi, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { LlmManifest } from 'llm-bridge-spec';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ModelCard } from './ModelCard';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { EmptyState } from '../layout/EmptyState';

export interface ModelManagerItem {
  id: string;
  name: string;
  provider: string;
  isActive: boolean;
  capabilities: string[];
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

  const handleSwitchModel = async (bridgeId: string) => {
    try {
      await onSwitch(bridgeId);
    } catch (error) {
      console.error('Failed to switch model:', error);
    }
  };

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
        throw new Error('Invalid manifest: missing required fields');
      }
      await onRegister?.(parsed);
      setRegisterOpen(false);
      onRefresh();
    } catch (error) {
      setSubmitError((error as Error).message);
    }
  };

  const totalBridges = items.length;
  const activeBridge = items.find((item) => item.isActive) ?? null;
  const activeCount = activeBridge ? 1 : 0;
  const standbyCount = Math.max(totalBridges - activeCount, 0);

  const capabilityStats = useMemo(() => {
    const unique = new Set<string>();
    items.forEach((item) => {
      item.capabilities?.forEach((cap) => unique.add(cap));
    });
    return unique.size;
  }, [items]);

  const coveragePercent = totalBridges > 0 ? Math.round((activeCount / totalBridges) * 100) : 0;
  const capabilityCoveragePercent =
    totalBridges > 0 ? Math.min(Math.round((capabilityStats / totalBridges) * 100), 100) : 0;

  const quickInsights = [
    {
      id: 'active-bridge',
      label: 'Active Bridge',
      value: activeBridge ? activeBridge.name : 'Not assigned',
      helper: activeBridge ? `${coveragePercent}% of bridges` : 'Select a bridge to activate',
      Icon: Wifi,
    },
    {
      id: 'capabilities',
      label: 'Unique Capabilities',
      value: capabilityStats.toLocaleString(),
      helper: 'Across installed bridges',
      Icon: Zap,
    },
    {
      id: 'standby',
      label: 'Standby Bridges',
      value: standbyCount.toLocaleString(),
      helper: 'Ready to switch instantly',
      Icon: Package,
    },
  ];

  const statusMetrics = [
    {
      id: 'active',
      label: 'Active',
      value: activeCount,
      percent: coveragePercent,
      helper: 'Serving traffic',
      Icon: Wifi,
      barClass: 'bg-status-active',
    },
    {
      id: 'standby',
      label: 'Standby',
      value: standbyCount,
      percent: totalBridges > 0 ? Math.round((standbyCount / totalBridges) * 100) : 0,
      helper: 'Configured but idle',
      Icon: Package,
      barClass: 'bg-status-idle',
    },
    {
      id: 'coverage',
      label: 'Capability Coverage',
      value: capabilityStats,
      percent: capabilityCoveragePercent,
      helper: 'Unique modalities & features',
      Icon: Zap,
      barClass: 'bg-primary',
    },
  ];

  const filteredItems = items.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }
    return (
      item.name.toLowerCase().includes(query) ||
      item.provider.toLowerCase().includes(query) ||
      item.capabilities?.some((cap) => cap.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Model Manager</h1>
            <p className="text-muted-foreground">Loading AI model configurations…</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Syncing</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse space-y-4">
              <div className="h-5 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-full" />
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 p-6 border-b bg-muted/10 space-y-6">
        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="relative overflow-hidden p-6 lg:col-span-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-4">
                <Badge variant="outline" className="w-fit">
                  Bridge Overview
                </Badge>
                <div>
                  <p className="text-sm text-muted-foreground">Total installed bridges</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold text-foreground">
                      {totalBridges.toLocaleString()}
                    </span>
                    {totalBridges > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {coveragePercent}% active
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  {quickInsights.map(({ id, label, value, helper, Icon }) => (
                    <div key={id} className="rounded-lg border bg-background/70 p-3 shadow-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
                      </div>
                      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{helper}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border bg-background/80 p-4 shadow-sm w-full max-w-xs space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Cpu className="w-4 h-4" />
                  <span className="text-sm font-medium">Active bridge context</span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {activeBridge ? activeBridge.name : 'No bridge active'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {activeBridge
                      ? activeBridge.capabilities?.join(', ') || 'Capabilities pending'
                      : 'Select a bridge to start routing requests.'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="flex-1 gap-2" onClick={onRefresh}>
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                  <Button className="gap-2" onClick={handleOpenRegister}>
                    <Plus className="w-4 h-4" />
                    Register
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:col-span-4 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <div className="space-y-4">
              <Badge variant="secondary" className="bg-white/15 text-white">
                Quick action
              </Badge>
              <h2 className="text-xl font-semibold">Install a new bridge</h2>
              <p className="text-sm text-white/80">
                Connect third-party LLM providers or local runtimes to expand orchestration
                coverage.
              </p>
              <div className="space-y-2">
                <Button
                  className="w-full gap-2 bg-white text-blue-600 hover:bg-white/90"
                  onClick={handleOpenRegister}
                >
                  <Plus className="w-4 h-4" />
                  Register LLM Bridge
                </Button>
                <Button
                  variant="secondary"
                  className="w-full gap-2 bg-white/10 hover:bg-white/20 text-white"
                  onClick={() => setActiveTab('marketplace')}
                >
                  Explore Marketplace
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription className="flex flex-col gap-2">
              <span>{errorMessage}</span>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                Check bridge credentials or configuration and try again.
                <Button variant="outline" size="sm" onClick={onDismissError}>
                  Dismiss
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {statusMetrics.map(({ id, label, value, percent, helper, Icon, barClass }) => (
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
                  style={{ width: `${Math.min(percent, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isRegisterOpen} onOpenChange={setRegisterOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register LLM Bridge</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Paste a valid LLM Bridge manifest (JSON) to register.
            </p>
            <Textarea
              value={manifestText}
              onChange={(event) => setManifestText(event.target.value)}
              rows={10}
              placeholder='{"name":"my-bridge","language":"node","models":["gpt-4o"], ...}'
            />
            {submitError && <div className="text-sm text-destructive">{submitError}</div>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegisterOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitRegister} disabled={!onRegister}>
              Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex-1 min-h-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as typeof activeTab)}
          className="h-full flex flex-col"
        >
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instances">Model Instances</TabsTrigger>
              <TabsTrigger value="bridges">Installed Bridges</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="instances" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bridges or capabilities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={onRefresh} className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </Button>
                    <Button onClick={handleOpenRegister} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add Model
                    </Button>
                  </div>
                </div>

                <div className="flex-1 min-h-0">
                  {filteredItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {filteredItems.map((item) => (
                        <ModelCard key={item.id} model={item} onSwitch={handleSwitchModel} />
                      ))}
                    </div>
                  )}

                  {filteredItems.length === 0 && (
                    <div className="h-full flex items-center justify-center">
                      <EmptyState
                        type="models"
                        title="No matching bridges"
                        description="Adjust your search filters or register a new bridge to expand coverage."
                        actionLabel="Register Bridge"
                        onAction={handleOpenRegister}
                        secondaryAction={{
                          label: 'Clear search',
                          onClick: () => setSearchQuery(''),
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="bridges" className="space-y-4">
              <Card className="p-6">
                <div className="flex flex-col gap-1 mb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Installed Bridges</h3>
                    <p className="text-sm text-muted-foreground">
                      Current adapters available for orchestration.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={onRefresh} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Sync
                  </Button>
                </div>
                <div className="space-y-3 text-sm">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col gap-3 rounded-lg border bg-background/80 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.provider}</p>
                        {item.capabilities.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.capabilities.map((cap) => (
                              <Badge key={cap} variant="secondary" className="text-xs">
                                {cap}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <Badge variant={item.isActive ? 'default' : 'outline'} className="text-xs">
                          {item.isActive ? 'Active' : 'Standby'}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSwitchModel(item.id)}
                        >
                          {item.isActive ? 'Reconnect' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="marketplace" className="space-y-4">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Marketplace preview</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Browse curated bridges from OpenAI, Anthropic, Hugging Face, and community
                  providers. Install integrations with one click once the marketplace is connected
                  to your workspace.
                </p>
                <Button onClick={handleOpenRegister} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Register from manifest
                </Button>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
