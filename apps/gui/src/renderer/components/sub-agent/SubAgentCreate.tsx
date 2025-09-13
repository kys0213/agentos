import { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Clock,
  Hash,
  Info,
  MinusCircle,
  Plus,
  Save,
  Settings,
  Target,
  Wand2,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { agentMetadataSchema } from '../../../shared/schema/agent.schemas';
import PresetPicker from '../preset/PresetPicker';
import {
  GuiAgentCategories,
  type GuiAgentCategory,
  GuiCategoryKeywordsMap,
} from '../../../shared/constants/agent-categories';
import { useMcpTools } from '../../hooks/queries/use-mcp';
import { applyAgentExport, serializeAgent, tryParseAgentExport } from '../../utils/agent-export';

interface AgentCreateProps {
  onBack: () => void;
  onCreate: (agent: CreateAgentMetadata) => void;
  presets: ReadonlyPreset[];
}

export function SubAgentCreate({ onBack, onCreate, presets }: AgentCreateProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form state
  const [formData, setFormData] = useState<Partial<CreateAgentMetadata>>({
    name: '',
    description: '',
    status: 'active',
    icon: '',
    preset: undefined,
    keywords: [],
  });
  const [selectedPresetId, setSelectedPresetId] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<GuiAgentCategory | undefined>(
    undefined
  );
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [selectedMcpIds, setSelectedMcpIds] = useState<Set<string>>(new Set());
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [importError, setImportError] = useState<string>('');

  const { data: mcpList, isLoading: mcpLoading } = useMcpTools();

  // Tags management
  const [newTag, setNewTag] = useState('');

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.keywords?.includes(newTag.trim())) {
      updateFormData({
        keywords: [...(formData.keywords ?? []), newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      keywords: formData.keywords?.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleCreate = () => {
    if (!validateFormData(formData)) {
      return;
    }

    // Apply AI Config overrides into preset if present
    let preset = formData.preset;
    if (preset) {
      preset = {
        ...preset,
        systemPrompt: systemPrompt || preset.systemPrompt,
        enabledMcps: Array.from(selectedMcpIds),
      } as any;
    }

    const newAgent: CreateAgentMetadata = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      preset: preset!,
      icon: formData.icon,
      keywords: formData.keywords?.length > 0 ? formData.keywords : [],
    };

    onCreate(newAgent);
  };

  const getStepFromTab = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 1;
      case 'category':
        return 2;
      case 'preset':
        return 3;
      case 'ai-config':
        return 4;
      case 'settings':
        return 5;
      default:
        return 1;
    }
  };

  const getTabFromStep = (step: number) => {
    switch (step) {
      case 1:
        return 'overview';
      case 2:
        return 'category';
      case 3:
        return 'preset';
      case 4:
        return 'ai-config';
      case 5:
        return 'settings';
      default:
        return 'overview';
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setCurrentStep(getStepFromTab(tab));
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setActiveTab(getTabFromStep(nextStep));
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      setActiveTab(getTabFromStep(prevStep));
    }
  };

  // Initialize systemPrompt from selected preset
  useEffect(() => {
    if (formData.preset && typeof formData.preset.systemPrompt === 'string') {
      setSystemPrompt(formData.preset.systemPrompt);
    }
  }, [formData.preset]);

  const toggleMcpSelection = (id: string) => {
    setSelectedMcpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const categoryDisplayName = useMemo(() => {
    if (!selectedCategory) return 'Not specified';
    const map: Record<GuiAgentCategory, string> = {
      general: 'General Purpose',
      research: 'Research',
      development: 'Development',
      creative: 'Creative',
      analytics: 'Analytics',
      customer_support: 'Customer Support',
    };
    return map[selectedCategory];
  }, [selectedCategory]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Agents
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                <div className="text-blue-600">
                  <Bot className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Create Agent</h1>
                <p className="text-muted-foreground">
                  Design a specialized AI agent for your workflows
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreate}
              disabled={!validateFormData(formData)}
              className="gap-2"
              data-testid="btn-final-create-agent"
            >
              <Save className="w-4 h-4" />
              Create Agent
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="font-medium">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className={currentStep >= 1 ? 'text-foreground font-medium' : ''}>Overview</span>
            <span className={currentStep >= 2 ? 'text-foreground font-medium' : ''}>Category</span>
            <span className={currentStep >= 3 ? 'text-foreground font-medium' : ''}>Preset</span>
            <span className={currentStep >= 4 ? 'text-foreground font-medium' : ''}>AI Config</span>
            <span className={currentStep >= 5 ? 'text-foreground font-medium' : ''}>Settings</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="category">Category</TabsTrigger>
            <TabsTrigger value="preset">Preset</TabsTrigger>
            <TabsTrigger value="ai-config">AI Config</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="overview" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-foreground">Agent Overview</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Agents are AI-powered assistants that can help with specific tasks and
                    workflows. Each agent is built on a preset configuration that defines its
                    capabilities, personality, and behavior patterns.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" />
                        Specialized
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Each agent is designed for specific tasks, making them more effective than
                        general-purpose assistants.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Orchestrated
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Agents can work together through @ mentions or automatic orchestration for
                        complex workflows.
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground flex items-center gap-2">
                        <Settings className="w-4 h-4 text-purple-500" />
                        Configurable
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Fine-tune behavior, status, and capabilities to match your specific workflow
                        requirements.
                      </p>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="agent-name">Agent Name *</Label>
                        <Input
                          id="agent-name"
                          value={formData.name}
                          onChange={(e) =>
                            updateFormData({
                              name: e.target.value,
                            })
                          }
                          placeholder="e.g., Research Assistant"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Choose a clear, descriptive name for your agent
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="agent-description">Description *</Label>
                        <Textarea
                          id="agent-description"
                          value={formData.description}
                          onChange={(e) =>
                            updateFormData({
                              description: e.target.value,
                            })
                          }
                          placeholder="Describe what this agent specializes in and how it helps users..."
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="agent-avatar">Avatar URL (Optional)</Label>
                        <Input
                          id="agent-avatar"
                          value={formData.icon}
                          onChange={(e) =>
                            updateFormData({
                              icon: e.target.value,
                            })
                          }
                          placeholder="https://example.com/avatar.png"
                          className="mt-1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Custom avatar image for your agent
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="agent-tags">Tags</Label>
                        <div className="mt-1 space-y-2">
                          <div className="flex gap-2">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              placeholder="Add a tag..."
                              onKeyPress={(e) =>
                                e.key === 'Enter' && (e.preventDefault(), addTag())
                              }
                              className="flex-1"
                            />
                            <Button variant="outline" size="sm" onClick={addTag} className="gap-1">
                              <Plus className="w-3 h-3" />
                              Add
                            </Button>
                          </div>
                          {formData.keywords && formData.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.keywords?.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="gap-1">
                                  <Hash className="w-3 h-3" />
                                  {tag}
                                  <button
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <div></div>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Choose Category
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="category" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Choose Agent Category
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select the primary category that best describes your agent's purpose and
                    capabilities.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {GuiAgentCategories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          updateFormData({ keywords: GuiCategoryKeywordsMap[cat] });
                        }}
                        className={`text-left border rounded-lg p-4 hover:bg-accent transition ${
                          selectedCategory === cat ? 'border-primary ring-1 ring-primary' : ''
                        }`}
                      >
                        <div className="font-medium capitalize">
                          {cat.replace('_', ' ')}
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground">
                          {'# ' + GuiCategoryKeywordsMap[cat].slice(0, 4).join('  # ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Overview
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2" disabled={!selectedCategory}>
                    Next: Choose Preset
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preset" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Select Base Preset</h3>
                  <p className="text-muted-foreground mb-6">
                    Choose a preset configuration that defines your agent's AI model, capabilities,
                    and behavior patterns.
                  </p>

                  <PresetPicker
                    presets={presets}
                    value={selectedPresetId}
                    onChange={(id) => {
                      setSelectedPresetId(id);
                      const selected = presets.find((p) => p.id === id);
                      if (selected) {
                        updateFormData({ preset: selected });
                      }
                    }}
                  />
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Category
                  </Button>
                  <Button onClick={handleNextStep} disabled={!formData.preset} className="gap-2">
                    Next: AI Config
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ai-config" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">System Prompt</h3>
                  <p className="text-muted-foreground mb-3">
                    Define or override the system prompt used by the selected preset.
                  </p>
                  <Textarea
                    value={systemPrompt}
                    onChange={(e) => setSystemPrompt(e.target.value)}
                    rows={8}
                    placeholder="Enter the system prompt that guides your agent's behavior..."
                  />
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">MCP Tools</h3>
                  <p className="text-muted-foreground mb-3">
                    Select tools to enable for this agent. You can connect/disconnect tools in the MCP manager.
                  </p>
                  <div className="space-y-2">
                    {mcpLoading && <div className="text-sm text-muted-foreground">Loading tools...</div>}
                    {!mcpLoading && (mcpList?.items?.length ?? 0) === 0 && (
                      <div className="text-sm text-muted-foreground">No tools found.</div>
                    )}
                    {!mcpLoading && (mcpList?.items?.length ?? 0) > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {mcpList!.items.map((t) => (
                          <label
                            key={t.id}
                            className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:bg-accent ${
                              selectedMcpIds.has(t.id) ? 'border-primary' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedMcpIds.has(t.id)}
                              onChange={() => toggleMcpSelection(t.id)}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{t.name}</span>
                                <span className={`text-xs rounded px-2 py-0.5 border ${
                                  t.status === 'connected'
                                    ? 'text-green-600 border-green-600'
                                    : t.status === 'error'
                                    ? 'text-red-600 border-red-600'
                                    : 'text-muted-foreground border-muted'
                                }`}>
                                  {t.status}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-2">
                                {t.description}
                              </div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Preset
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Agent Settings
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Agent Settings</h3>
                  <p className="text-muted-foreground mb-6">
                    Configure how your agent behaves and when it can be activated.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <Label htmlFor="agent-status">Initial Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: 'active' | 'idle' | 'inactive') =>
                          updateFormData({ status: value })
                        }
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <div>
                                <div className="font-medium">Active</div>
                                <div className="text-xs text-muted-foreground">
                                  Auto-participate in conversations
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="idle">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-orange-600" />
                              <div>
                                <div className="font-medium">Idle</div>
                                <div className="text-xs text-muted-foreground">
                                  Respond only to @mentions
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                          <SelectItem value="inactive">
                            <div className="flex items-center gap-2">
                              <MinusCircle className="w-4 h-4 text-gray-600" />
                              <div>
                                <div className="font-medium">Inactive</div>
                                <div className="text-xs text-muted-foreground">
                                  Completely disabled
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Export / Import */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Export / Import</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Export */}
                    <div>
                      <Label className="text-sm">Export Agent as JSON</Label>
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!validateFormData(formData)) return;
                            const json = JSON.stringify(serializeAgent(formData as any), null, 2);
                            setExportJson(json);
                          }}
                        >
                          Generate JSON
                        </Button>
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(exportJson);
                            } catch {}
                          }}
                          disabled={!exportJson}
                        >
                          Copy
                        </Button>
                      </div>
                      <Textarea className="mt-2 h-40" value={exportJson} readOnly placeholder="Generated JSON will appear here" />
                    </div>
                    {/* Import */}
                    <div>
                      <Label className="text-sm">Import Preset JSON</Label>
                      <Textarea
                        className="mt-2 h-40"
                        value={importJson}
                        onChange={(e) => {
                          setImportJson(e.target.value);
                          setImportError('');
                        }}
                        placeholder="Paste exported agent JSON here"
                      />
                      {importError && (
                        <p className="text-xs text-red-600 mt-1">{importError}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            const parsed = tryParseAgentExport(importJson);
                            if (!parsed) {
                              setImportError('Invalid JSON');
                              return;
                            }
                            const next = applyAgentExport(formData, parsed);
                            setSystemPrompt(parsed.preset.systemPrompt ?? '');
                            updateFormData(next as any);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Configuration Summary */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Configuration Summary
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground">Agent Name</Label>
                        <p className="font-medium">{formData.name || 'Not specified'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Category</Label>
                        <p className="font-medium">{categoryDisplayName}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Base Preset</Label>
                        <p className="font-medium">{formData.preset?.name || 'Not selected'}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Initial Status</Label>
                        <div className="flex items-center gap-2">
                          {formData.status === 'active' && (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          )}
                          {formData.status === 'idle' && (
                            <Clock className="w-4 h-4 text-orange-600" />
                          )}
                          {formData.status === 'inactive' && (
                            <MinusCircle className="w-4 h-4 text-gray-600" />
                          )}
                          <span className="font-medium capitalize">{formData.status}</span>
                        </div>
                      </div>
                    </div>

                    {formData.description && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Description</Label>
                        <p className="text-sm">{formData.description}</p>
                      </div>
                    )}

                    {formData.keywords && formData.keywords.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.keywords.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Preset
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!validateFormData(formData)}
                    className="gap-2"
                  >
                    <Wand2 className="w-4 h-4" />
                    Create Agent
                  </Button>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function validateFormData(formData: Partial<CreateAgentMetadata>): formData is CreateAgentMetadata {
  const result = agentMetadataSchema.safeParse(formData);

  if (!result.success) {
    return false;
  }

  return true;
}
