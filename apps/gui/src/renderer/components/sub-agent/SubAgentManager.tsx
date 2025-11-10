import type { LucideIcon } from 'lucide-react';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Download,
  HelpCircle,
  Info,
  MessageSquare,
  MinusCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Upload,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import type { AgentStatus, ReadonlyAgentMetadata } from '@agentos/core';
import { SubAgentBadge } from './SubAgentBadge';
import { CategoryIcon } from '../common/CategoryIcon';
import {
  GuiAgentCategories,
  GuiCategoryKeywordsMap,
  type GuiAgentCategory,
} from '../../../shared/constants/agent-categories';
import { EmptyState } from '../layout/EmptyState';
import { EXPORT_IMPORT_MESSAGES } from '../../constants/export-import-messages';
import { useToast } from '../ui/use-toast';

export type ChatOpenOptions = { mode?: 'navigate' | 'preview' };

export interface SubAgentManagerProps {
  agents: ReadonlyAgentMetadata[];
  onUpdateAgentStatus: (agentId: string, newStatus: AgentStatus) => void;
  onOpenChat?: (agentId: string, options?: ChatOpenOptions) => void;
  onExportAgent?: (agentId: string) => Promise<string>;
  onImportAgent?: (agentId: string, json: string) => Promise<void>;
  onCreateAgent?: () => void;
  forceEmptyState?: boolean;
  onToggleEmptyState?: () => void;
}

export function SubAgentManager({
  agents,
  onUpdateAgentStatus,
  onOpenChat = () => undefined,
  onExportAgent,
  onImportAgent,
  onCreateAgent,
  forceEmptyState = false,
  onToggleEmptyState,
}: SubAgentManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | GuiAgentCategory>('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('agents');
  const [showStatusGuide, setShowStatusGuide] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importAgentId, setImportAgentId] = useState<string | null>(null);
  const [importAgentName, setImportAgentName] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const importTargetLabel = importAgentName || 'the selected agent';
  const [exportPreview, setExportPreview] = useState<{
    open: boolean;
    agentName: string;
    json: string;
  }>({ open: false, agentName: '', json: '' });
  const { toast } = useToast();

  const closeExportPreview = () => {
    setExportPreview({ open: false, agentName: '', json: '' });
  };

  const handleExportDialogCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportPreview.json);
      toast({
        title: 'Copied JSON',
        description: EXPORT_IMPORT_MESSAGES.EXPORT_SUCCESS,
      });
      closeExportPreview();
    } catch (error) {
      console.warn('[SubAgentManager] Copy from dialog failed', error);
      toast({
        variant: 'destructive',
        title: 'Copy failed',
        description: 'Unable to access the clipboard. Please select and copy manually.',
      });
    }
  };

  const handleStatusChange = (agentId: string, newStatus: 'active' | 'idle' | 'inactive') => {
    onUpdateAgentStatus(agentId, newStatus);
  };

  const handleCreateAgent = () => {
    if (onCreateAgent) {
      onCreateAgent();
    }
  };

  const handleExportAgent = async (agent: ReadonlyAgentMetadata) => {
    if (!onExportAgent) {
      return;
    }
    try {
      const json = await onExportAgent(agent.id);
      try {
        await navigator.clipboard.writeText(json);
        toast({
          title: 'Export ready',
          description: EXPORT_IMPORT_MESSAGES.EXPORT_SUCCESS,
        });
      } catch (clipboardError) {
        console.warn('[SubAgentManager] Clipboard write failed', clipboardError);
        setExportPreview({
          open: true,
          agentName: agent.name ?? 'Unnamed agent',
          json,
        });
        toast({
          variant: 'destructive',
          title: 'Clipboard unavailable',
          description: 'Copy the exported JSON manually from the dialog.',
        });
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : EXPORT_IMPORT_MESSAGES.EXPORT_ERROR;
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: message,
      });
    }
  };

  const openImportDialog = (agent: ReadonlyAgentMetadata) => {
    setImportAgentId(agent.id);
    setImportAgentName(agent.name ?? '');
    setImportJson('');
    setImportError('');
    setIsImporting(false);
    setImportDialogOpen(true);
  };

  const handleImportSubmit = async () => {
    if (!importAgentId || !onImportAgent) {
      setImportError(EXPORT_IMPORT_MESSAGES.IMPORT_UNAVAILABLE);
      return;
    }
    if (!importJson.trim()) {
      setImportError(EXPORT_IMPORT_MESSAGES.IMPORT_EMPTY);
      return;
    }
    try {
      setIsImporting(true);
      setImportError('');
      await onImportAgent(importAgentId, importJson);
      setImportDialogOpen(false);
      toast({
        title: 'Import complete',
        description: EXPORT_IMPORT_MESSAGES.IMPORT_SUCCESS,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : EXPORT_IMPORT_MESSAGES.IMPORT_ERROR;
      setImportError(message);
      toast({
        variant: 'destructive',
        title: 'Import failed',
        description: message,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const totalAgents = agents.length;
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const idleAgents = agents.filter((a) => a.status === 'idle').length;
  const inactiveAgents = agents.filter((a) => a.status === 'inactive').length;
  const activePercent = totalAgents > 0 ? Math.round((activeAgents / totalAgents) * 100) : 0;
  const idlePercent = totalAgents > 0 ? Math.round((idleAgents / totalAgents) * 100) : 0;
  const inactivePercent = totalAgents > 0 ? Math.round((inactiveAgents / totalAgents) * 100) : 0;

  const statusMetrics: Array<{
    id: 'active' | 'idle' | 'inactive';
    label: string;
    value: number;
    percent: number;
    icon: LucideIcon;
    barClass: string;
    helper: string;
  }> = [
    {
      id: 'active',
      label: 'Active',
      value: activeAgents,
      percent: activePercent,
      icon: CheckCircle,
      barClass: 'bg-status-active',
      helper: 'Auto-orchestrated',
    },
    {
      id: 'idle',
      label: 'Idle',
      value: idleAgents,
      percent: idlePercent,
      icon: Clock,
      barClass: 'bg-status-idle',
      helper: 'Respond on mention',
    },
    {
      id: 'inactive',
      label: 'Inactive',
      value: inactiveAgents,
      percent: inactivePercent,
      icon: MinusCircle,
      barClass: 'bg-status-inactive',
      helper: 'Needs re-enable',
    },
  ];

  const statuses = [
    { id: 'all', label: 'All Status', count: totalAgents },
    ...statusMetrics.map((metric) => ({
      id: metric.id,
      label: metric.label,
      count: metric.value,
    })),
  ];

  const filteredAgents = agents.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' ||
      agent.keywords.some((kw) => GuiCategoryKeywordsMap[selectedCategory]?.includes(kw));

    const matchesStatus = selectedStatus === 'all' || agent.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const showDemoEmptyState = forceEmptyState && totalAgents > 0;
  const shouldShowEmptyState = forceEmptyState || totalAgents === 0;

  if (shouldShowEmptyState) {
    const handlePrimaryAction = () => {
      if (onCreateAgent) {
        onCreateAgent();
        return;
      }
      onToggleEmptyState?.();
    };

    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="max-w-lg w-full">
          <EmptyState
            type="agents"
            title={showDemoEmptyState ? 'No agents to display' : 'No sub-agents yet'}
            description="Create your first specialist to orchestrate tasks or assist in chat sessions."
            actionLabel={onCreateAgent ? 'Create Agent' : 'Reload Agents'}
            onAction={handlePrimaryAction}
            secondaryAction={
              showDemoEmptyState && onToggleEmptyState
                ? {
                    label: 'Show Agents',
                    onClick: onToggleEmptyState,
                  }
                : undefined
            }
          />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Overview & Metrics */}
        <div className="flex-shrink-0 p-6 border-b space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Sub Agent Manager</h1>
                <p className="text-sm text-muted-foreground">
                  Monitor orchestration state and deploy new specialists
                </p>
              </div>
            </div>
            {onCreateAgent && (
              <div className="flex items-center gap-3">
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-medium text-foreground">Ready to expand?</p>
                  <p className="text-xs text-muted-foreground">Create specialized AI agents</p>
                </div>
                <Button
                  onClick={handleCreateAgent}
                  className="gap-2 relative overflow-hidden group bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                  size="lg"
                  data-testid="btn-create-agent"
                >
                  <div className="relative z-10 flex items-center gap-2">
                    <div className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-foreground/20">
                      <Plus className="w-3 h-3" />
                    </div>
                    <span className="font-medium">Create Agent</span>
                    <Sparkles className="w-4 h-4 opacity-80" />
                  </div>
                  <div className="absolute inset-0 translate-x-[-110%] bg-gradient-to-r from-primary-foreground/0 via-primary-foreground/20 to-primary-foreground/0 transition-transform duration-700 group-hover:translate-x-[110%]" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statusMetrics.map(
              ({ id, label, value, percent, icon: StatusIcon, helper, barClass }) => (
                <Card key={id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <StatusIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {percent}%
                    </Badge>
                  </div>
                  <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
                  <div className="mt-3 h-2 rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${barClass}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{helper}</p>
                </Card>
              )
            )}
          </div>

          {/* Collapsible Status Guide */}
          <Collapsible open={showStatusGuide} onOpenChange={setShowStatusGuide}>
            <CollapsibleTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between mb-3 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>Agent Status Guide</span>
                </div>
                {showStatusGuide && <ChevronUp className="w-4 h-4" />}
                {!showStatusGuide && <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-4 mb-4 bg-gradient-to-br from-gray-50 to-gray-100/50">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Active</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically participates in conversations via the orchestrator system
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <span className="font-medium text-orange-700">Idle</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Only responds when explicitly mentioned with @agent-name
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <MinusCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Inactive</span>
                      <p className="text-xs text-muted-foreground mt-1">
                        Completely disabled and cannot be called or participate
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Content with more space for agent list */}
        <div className="flex-1 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 pt-4">
              <TabsList>
                <TabsTrigger value="agents">Agent List</TabsTrigger>
                <TabsTrigger value="orchestration">Orchestration</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 min-h-0 px-6 pb-6">
              <TabsContent value="agents" className="h-full">
                <div className="space-y-3 h-full flex flex-col">
                  {/* Compact Filters */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search agents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>

                    <Select
                      value={selectedCategory}
                      onValueChange={(val) => setSelectedCategory(val as 'all' | GuiAgentCategory)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {GuiAgentCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.id}>
                            {status.label} ({status.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Status indicators in filters */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <Clock className="w-3 h-3 text-orange-600" />
                      <MinusCircle className="w-3 h-3 text-gray-600" />
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-muted-foreground ml-1" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Hover over status badges for details</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Agent Grid - Now takes more space */}
                  <div className="flex-1 min-h-0">
                    <ScrollArea className="h-full">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
                        {filteredAgents.map((agent) => (
                          <Card
                            key={agent.id}
                            className="p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] border border-gray-200"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <CategoryIcon category={agent.keywords[0]} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h3 className="font-medium text-foreground truncate text-sm">
                                    {agent.name}
                                  </h3>
                                  <p className="text-xs text-muted-foreground capitalize">
                                    {agent.keywords[0]}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <SubAgentBadge status={agent.status} />
                                {(onExportAgent || onImportAgent) && (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <MoreHorizontal className="w-4 h-4" />
                                        <span className="sr-only">Agent actions</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      {onExportAgent && (
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault();
                                            void handleExportAgent(agent);
                                          }}
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Export JSON
                                        </DropdownMenuItem>
                                      )}
                                      {onImportAgent && (
                                        <DropdownMenuItem
                                          onSelect={(event) => {
                                            event.preventDefault();
                                            openImportDialog(agent);
                                          }}
                                        >
                                          <Upload className="w-4 h-4 mr-2" />
                                          Import JSON
                                        </DropdownMenuItem>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                )}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {agent.description}
                            </p>

                            <div className="space-y-1.5 mb-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Usage:</span>
                                <span className="font-medium">{agent.usageCount}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Last Used:</span>
                                <span className="font-medium">
                                  {agent.lastUsed ? agent.lastUsed.toLocaleDateString() : 'Never'}
                                </span>
                              </div>
                            </div>

                            {/* Status Control */}
                            <div className="space-y-2">
                              <Select
                                value={agent.status}
                                onValueChange={(value: 'active' | 'idle' | 'inactive') =>
                                  handleStatusChange(agent.id, value)
                                }
                              >
                                <SelectTrigger className="w-full h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="active">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle className="w-3 h-3 text-green-600" />
                                      Active
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="idle">
                                    <div className="flex items-center gap-2">
                                      <Clock className="w-3 h-3 text-orange-600" />
                                      Idle
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="inactive">
                                    <div className="flex items-center gap-2">
                                      <MinusCircle className="w-3 h-3 text-gray-600" />
                                      Inactive
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="flex gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 h-7 text-xs hover:bg-blue-50 hover:border-blue-200"
                                  data-testid={`agent-card-chat-${agent.id}`}
                                  onClick={() => onOpenChat(agent.id, { mode: 'preview' })}
                                >
                                  <MessageSquare className="w-3 h-3 mr-1" />
                                  Chat
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

              <TabsContent value="orchestration" className="h-full">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Orchestration Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-foreground">
                          Auto-Orchestration
                        </label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Allow the system to automatically route messages to active agents
                        </p>
                        <Select defaultValue="enabled">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enabled">Enabled</SelectItem>
                            <SelectItem value="disabled">Disabled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold text-foreground mb-3">Active Agents</h3>
                    <div className="space-y-2">
                      {agents
                        .filter((a) => a.status === 'active')
                        .map((agent) => (
                          <div
                            key={agent.id}
                            className="flex items-center justify-between p-2 status-active-subtle rounded"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                                <CategoryIcon category={agent.keywords[0]} />
                              </div>
                              <div>
                                <span className="text-sm font-medium text-foreground">
                                  {agent.name}
                                </span>
                                <p className="text-xs text-muted-foreground">{agent.description}</p>
                              </div>
                            </div>
                            <Badge className="status-active">Active</Badge>
                          </div>
                        ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="h-full">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Most Used Agents</h4>
                    <div className="space-y-2">
                      {agents
                        .sort((a, b) => b.usageCount - a.usageCount)
                        .slice(0, 5)
                        .map((agent) => (
                          <div
                            key={agent.id}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm font-medium">{agent.name}</span>
                            <span className="text-sm text-muted-foreground">
                              {agent.usageCount} uses
                            </span>
                          </div>
                        ))}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h4 className="font-medium text-foreground mb-3">Status Distribution</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm">Active</span>
                        </div>
                        <span className="text-sm font-medium">{activeAgents} agents</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-orange-600" />
                          <span className="text-sm">Idle</span>
                        </div>
                        <span className="text-sm font-medium">{idleAgents} agents</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MinusCircle className="w-4 h-4 text-gray-600" />
                          <span className="text-sm">Inactive</span>
                        </div>
                        <span className="text-sm font-medium">{inactiveAgents} agents</span>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      <Dialog
        open={importDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setImportDialogOpen(false);
            setImportAgentId(null);
            setImportAgentName('');
            setImportJson('');
            setImportError('');
            setIsImporting(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Agent Configuration</DialogTitle>
            <DialogDescription aria-live="polite">
              Paste the JSON exported from another agent. This will overwrite the current
              configuration for{' '}
              <span
                className="font-medium"
                aria-label={`Configuration overwrite target: ${importTargetLabel}`}
              >
                {importAgentName || 'the selected agent'}
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={importJson}
            onChange={(event) => {
              setImportJson(event.target.value);
              setImportError('');
            }}
            placeholder='{"name": "Agent", ...}'
            aria-label={`Paste exported agent JSON for ${importTargetLabel}`}
            className="min-h-[200px] font-mono"
          />
          {importError && (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{importError}</AlertDescription>
            </Alert>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setImportDialogOpen(false)}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleImportSubmit}
              disabled={isImporting}
              aria-label={`Import JSON for ${importTargetLabel}`}
            >
              {isImporting ? 'Importing…' : 'Import JSON'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={exportPreview.open}
        onOpenChange={(open) => (!open ? closeExportPreview() : null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Manual Export Copy</DialogTitle>
            <DialogDescription aria-live="polite">
              Clipboard access is unavailable. Copy the JSON below for{' '}
              <span className="font-medium">{exportPreview.agentName}</span>.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={exportPreview.json}
            onChange={() => undefined}
            readOnly
            aria-label={`Export JSON for ${exportPreview.agentName}`}
            className="min-h-[200px] font-mono"
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={closeExportPreview}>
              Close
            </Button>
            <Button type="button" onClick={handleExportDialogCopy}>
              <Copy className="mr-2 h-4 w-4" />
              Copy JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
