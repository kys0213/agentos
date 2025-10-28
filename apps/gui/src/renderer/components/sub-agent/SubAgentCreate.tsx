import type { CreateAgentMetadata, ReadonlyPreset } from '@agentos/core';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Hash,
  Info,
  MinusCircle,
  Save,
  Settings,
  Target,
  Wand2,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import BridgeModelSettings from '../preset/BridgeModelSettings';
import {
  GuiAgentCategories,
  type GuiAgentCategory,
  GuiCategoryKeywordsMap,
} from '../../../shared/constants/agent-categories';
import { useMcpTools } from '../../hooks/queries/use-mcp';
import { applyAgentExport, serializeAgent, tryParseAgentExport } from '../../utils/agent-export';
import { Alert, AlertDescription } from '../ui/alert';
import StepperTabs, { StepperTabContent } from '../common/StepperTabs';

interface AgentCreateProps {
  onBack: () => void;
  onCreate: (agent: CreateAgentMetadata) => void;
  presetTemplate: ReadonlyPreset;
  isSubmitting?: boolean;
  submitError?: string | null;
  currentStepId?: StepKey;
  onStepChange?: (step: StepKey) => void;
}

type StepKey = 'overview' | 'category' | 'ai-config' | 'settings';
const STEP_ORDER: StepKey[] = ['overview', 'category', 'ai-config', 'settings'];
const STEP_LABELS: Record<StepKey, string> = {
  overview: 'Overview',
  category: 'Category',
  'ai-config': 'AI Config',
  settings: 'Settings',
};

const STEP_NEXT_COPY: Partial<Record<StepKey, string>> = {
  overview: 'Category',
  category: 'AI Config',
  'ai-config': 'Agent Settings',
};

const STEP_PREV_COPY: Partial<Record<StepKey, string>> = {
  category: 'Overview',
  'ai-config': 'Category',
  settings: 'AI Config',
};

const STATUS_OPTIONS: Array<{ id: 'active' | 'idle' | 'inactive'; label: string; helper: string }> =
  [
    { id: 'active', label: 'Active', helper: 'Auto-participate in conversations' },
    { id: 'idle', label: 'Idle', helper: 'Respond only to @mentions' },
    { id: 'inactive', label: 'Inactive', helper: 'Completely disabled' },
  ];

const CATEGORY_TITLES: Record<GuiAgentCategory, string> = {
  general: 'General Purpose',
  research: 'Research',
  development: 'Development',
  creative: 'Creative',
  analytics: 'Analytics',
  customer_support: 'Customer Support',
};

const CATEGORY_DESCRIPTIONS: Record<GuiAgentCategory, string> = {
  general: 'Versatile assistant for various tasks',
  research: 'Information gathering, fact-checking, and analysis',
  development: 'Code writing, debugging, and software engineering',
  creative: 'Content creation, writing, and creative tasks',
  analytics: 'Data analysis, visualization, and insights',
  customer_support: 'Customer service, support, and engagement',
};

// review: mcp 를 전달받고 preset 은 생성하지 않음. 또한 preset 은 import/export 시에 직렬화된 스펙이라고 가정해야함.
// review: 전반적으로 코드가 너무 길고 리펙토링이 필요해보임. 가독성이 떨어짐.
// review: export, import 는 여기서 노출할게 아니라 상단에 import 가 있어야함.
// review: export 는 agent 메뉴에서 export 버튼이 있어야함.
// review: preset 은 직렬화된 agent 스펙이므로 유저가 입력한 정보들을 바탕으로 preset 을 생성하고 agent 생성시 주입하여 적절하게 로드될 수 있게 해야함.
export function SubAgentCreate({
  onBack,
  onCreate,
  presetTemplate,
  isSubmitting = false,
  submitError,
  currentStepId: currentStepProp,
  onStepChange,
}: AgentCreateProps) {
  const stepConfigs = useMemo(() => STEP_ORDER.map((id) => ({ id, label: STEP_LABELS[id] })), []);
  const totalSteps = STEP_ORDER.length;

  const isControlled = currentStepProp !== undefined;
  const [internalStepId, setInternalStepId] = useState<StepKey>(currentStepProp ?? 'overview');

  useEffect(() => {
    if (currentStepProp && currentStepProp !== internalStepId) {
      setInternalStepId(currentStepProp);
    }
  }, [currentStepProp, internalStepId]);

  const updateCurrentStep = (step: StepKey) => {
    if (!isControlled) {
      setInternalStepId(step);
    }
    onStepChange?.(step);
  };

  const currentStepId = currentStepProp ?? internalStepId;
  const currentStepIndex = STEP_ORDER.indexOf(currentStepId);

  const [overview, setOverview] = useState({
    name: '',
    description: '',
    icon: '',
    keywords: [] as string[],
  });

  const [selectedCategory, setSelectedCategory] = useState<GuiAgentCategory | undefined>();
  const [status, setStatus] = useState<'active' | 'idle' | 'inactive'>('active');
  const [presetState, setPresetState] = useState<ReadonlyPreset>(presetTemplate);

  const initialBridgeId =
    (presetTemplate.llmBridgeConfig?.bridgeId as string | undefined) ??
    presetTemplate.llmBridgeName ??
    '';

  const initialBridgeConfig = useMemo(() => {
    const cfg = { ...(presetTemplate.llmBridgeConfig ?? {}) } as Record<string, unknown>;
    delete cfg.bridgeId;
    return cfg;
  }, [presetTemplate.llmBridgeConfig]);

  const [bridgeId, setBridgeId] = useState<string>(initialBridgeId);
  const [bridgeConfig, setBridgeConfig] = useState<Record<string, unknown>>(initialBridgeConfig);
  const [systemPrompt, setSystemPrompt] = useState<string>(presetTemplate.systemPrompt ?? '');
  const [selectedMcpIds, setSelectedMcpIds] = useState<Set<string>>(
    () => new Set((presetTemplate.enabledMcps ?? []).map((m) => m.name).filter(Boolean) as string[])
  );

  const [exportJson, setExportJson] = useState('');
  const [importJson, setImportJson] = useState('');
  const [importError, setImportError] = useState('');

  const [stepErrors, setStepErrors] = useState<Partial<Record<StepKey, string | null>>>({});

  const { data: mcpList, isLoading: mcpLoading } = useMcpTools();

  const getToolStatusClass = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600 border-green-600';
      case 'error':
        return 'text-red-600 border-red-600';
      default:
        return 'text-muted-foreground border-muted';
    }
  };

  const renderEnabledMcpBadges = () => {
    const enabled = previewAgent?.preset.enabledMcps ?? [];
    if (enabled.length === 0) {
      return <p className="text-sm text-muted-foreground mt-1">None selected</p>;
    }

    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {enabled.map((tool) => (
          <Badge key={tool.name} variant="outline" className="text-xs">
            {tool.name}
          </Badge>
        ))}
      </div>
    );
  };

  useEffect(() => {
    setPresetState(presetTemplate);
    setBridgeId(initialBridgeId);
    setBridgeConfig(initialBridgeConfig);
    setSystemPrompt(presetTemplate.systemPrompt ?? '');
    setSelectedMcpIds(
      new Set((presetTemplate.enabledMcps ?? []).map((m) => m.name).filter(Boolean) as string[])
    );
  }, [initialBridgeConfig, initialBridgeId, presetTemplate]);

  const applyStepError = (key: StepKey, message: string) => {
    setStepErrors((prev) => ({ ...prev, [key]: message }));
  };

  const clearStepError = (key: StepKey) => {
    setStepErrors((prev) => ({ ...prev, [key]: null }));
  };

  const validators: Record<StepKey, () => string | null> = {
    overview: () => {
      if (!overview.name.trim()) {
        return 'Agent name is required.';
      }
      if (!overview.description.trim()) {
        return 'Agent description is required.';
      }
      return null;
    },
    category: () => {
      if (!selectedCategory) {
        return 'Please choose an agent category.';
      }
      return null;
    },
    'ai-config': () => {
      if (!systemPrompt.trim()) {
        return 'System prompt cannot be empty.';
      }
      if (!bridgeId) {
        // review: 지금 실제 pnpm dev 로 실행한 electorn 에서는 이 지점에서 오류 발생중. llm bridge 를 선택했는데도 발생하여 확인 필요함.
        return 'Select an LLM bridge before continuing.';
      }
      return null;
    },
    settings: () => {
      if (!status) {
        return 'Initial status is required.';
      }
      return null;
    },
  };

  const ensureStepValid = (key: StepKey) => {
    const error = validators[key]();
    if (error) {
      applyStepError(key, error);
      return false;
    }
    clearStepError(key);
    return true;
  };

  const renderStepError = (key: StepKey) => {
    const error = stepErrors[key];
    if (!error) {
      return null;
    }
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  const handleStepChange = (stepId: string) => {
    if (!STEP_ORDER.includes(stepId as StepKey)) {
      return;
    }
    const targetKey = stepId as StepKey;
    const targetIndex = STEP_ORDER.indexOf(targetKey);
    if (targetIndex > currentStepIndex) {
      ensureStepValid(currentStepId);
    }
    if (targetKey !== currentStepId) {
      updateCurrentStep(targetKey);
    }
  };

  const handleNextStep = () => {
    if (currentStepIndex >= totalSteps - 1) {
      return;
    }
    if (!ensureStepValid(currentStepId)) {
      return;
    }
    const nextKey = STEP_ORDER[currentStepIndex + 1];
    if (nextKey !== currentStepId) {
      updateCurrentStep(nextKey);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex <= 0) {
      return;
    }
    const prevKey = STEP_ORDER[currentStepIndex - 1];
    if (prevKey !== currentStepId) {
      updateCurrentStep(prevKey);
    }
  };

  const toggleMcpSelection = (id: string) => {
    setSelectedMcpIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    clearStepError('ai-config');
  };

  const categoryDisplayName = useMemo(() => {
    if (!selectedCategory) {
      return 'Not specified';
    }
    return CATEGORY_TITLES[selectedCategory];
  }, [selectedCategory]);

  const buildAgentPayload = (): CreateAgentMetadata | null => {
    if (!overview.name.trim() || !overview.description.trim()) {
      return null;
    }
    const mergedBridgeConfig: Record<string, unknown> = {
      ...(presetState.llmBridgeConfig ?? {}),
      ...bridgeConfig,
    };
    if (bridgeId) {
      mergedBridgeConfig.bridgeId = bridgeId;
    }

    const mergedPreset: ReadonlyPreset = {
      ...presetState,
      llmBridgeName: bridgeId || presetState.llmBridgeName,
      llmBridgeConfig: mergedBridgeConfig,
      systemPrompt,
      enabledMcps: Array.from(selectedMcpIds).map((name) => ({
        name,
        enabledTools: [],
        enabledResources: [],
        enabledPrompts: [],
      })),
    };

    return {
      name: overview.name.trim(),
      description: overview.description.trim(),
      status,
      preset: mergedPreset,
      icon: overview.icon?.trim() ?? '',
      keywords: overview.keywords,
    };
  };

  const previewAgent = useMemo(
    () => buildAgentPayload(),
    [overview, status, presetState, bridgeConfig, bridgeId, systemPrompt, selectedMcpIds]
  );

  const focusFirstInvalidStep = () => {
    for (const step of STEP_ORDER) {
      const message = validators[step]();
      if (message) {
        applyStepError(step, message);
        if (step !== currentStepId) {
          updateCurrentStep(step);
        }
        if (typeof window !== 'undefined' && typeof window.alert === 'function') {
          if (typeof document !== 'undefined') {
            try {
              const bodyHtml = document.body?.outerHTML ?? '';
              console.group('[subagent-create] alert triggered');
              console.info('message:', message);
              console.info('body.outerHTML:', bodyHtml);
              console.groupEnd();
            } catch (error) {
              console.warn('[subagent-create] failed to log body snapshot', error);
            }
          }
          window.alert(message);
        }
        return false;
      }
      clearStepError(step);
    }
    return true;
  };

  const handleCreate = () => {
    if (!focusFirstInvalidStep()) {
      return;
    }
    const payload = buildAgentPayload();
    if (!payload) {
      return;
    }
    onCreate(payload);
  };

  const addTag = () => {
    const value = newTag.trim();
    if (!value) {
      return;
    }
    if (overview.keywords.includes(value)) {
      return;
    }
    setOverview((prev) => ({ ...prev, keywords: [...prev.keywords, value] }));
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setOverview((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((keyword) => keyword !== tag),
    }));
  };

  const handleCategorySelect = (category: GuiAgentCategory) => {
    setSelectedCategory(category);
    clearStepError('category');
    const autoKeywords = GuiCategoryKeywordsMap[category] ?? [];
    setOverview((prev) => ({
      ...prev,
      keywords: Array.from(new Set([...prev.keywords, ...autoKeywords])),
    }));
  };

  const [newTag, setNewTag] = useState('');

  const effectiveBridgeConfig = useMemo(() => {
    const merged = { ...(bridgeConfig ?? {}) } as Record<string, unknown>;
    merged.bridgeId = bridgeId;
    return merged;
  }, [bridgeConfig, bridgeId]);

  const handleExport = () => {
    const payload = buildAgentPayload();
    if (!payload) {
      ensureStepValid(currentStepId);
      return;
    }
    const serialized = serializeAgent(payload);
    setExportJson(JSON.stringify(serialized, null, 2));
  };

  const handleApplyImport = () => {
    const parsed = tryParseAgentExport(importJson);
    if (!parsed) {
      setImportError('Invalid JSON format. Please check the contents and try again.');
      return;
    }
    const updated = applyAgentExport({ preset: presetState }, parsed);
    setOverview((prev) => ({
      ...prev,
      name: updated.name ?? prev.name,
      description: updated.description ?? prev.description,
      icon: updated.icon ?? prev.icon,
      keywords: updated.keywords ? Array.from(updated.keywords) : prev.keywords,
    }));
    if (updated.status === 'active' || updated.status === 'idle' || updated.status === 'inactive') {
      setStatus(updated.status);
    }
    if (updated.preset) {
      setPresetState(updated.preset);
      setSystemPrompt(updated.preset.systemPrompt ?? '');
      const importedBridgeId =
        (updated.preset.llmBridgeConfig?.bridgeId as string | undefined) ??
        updated.preset.llmBridgeName ??
        '';
      setBridgeId(importedBridgeId);
      const cfg = { ...(updated.preset.llmBridgeConfig ?? {}) } as Record<string, unknown>;
      delete cfg.bridgeId;
      setBridgeConfig(cfg);
      setSelectedMcpIds(
        new Set(
          Array.from(updated.preset.enabledMcps ?? [])
            .map((m) => m.name)
            .filter(Boolean) as string[]
        )
      );
    }
    setImportError('');
    updateCurrentStep('settings');
  };

  const stepBadge = {
    label: `Step ${currentStepIndex + 1} of ${totalSteps}`,
    icon: <Clock className="w-3 h-3" />,
  };

  const headerActionLabel = (
    <>
      <Save className="w-4 h-4" />
      {isSubmitting ? 'Creating…' : 'Create Agent'}
    </>
  );

  return (
    <StepperTabs
      steps={stepConfigs}
      currentStep={currentStepId}
      onStepChange={handleStepChange}
      onBack={onBack}
      backLabel="Back to Agents"
      title="Create Agent"
      description="Design a specialized AI agent for your workflows"
      badge={stepBadge}
      onAction={handleCreate}
      actionLabel={headerActionLabel}
      actionDisabled={isSubmitting}
    >
      <StepperTabContent stepId="overview">
        <div className="max-w-4xl mx-auto space-y-6">
          {renderStepError('overview')}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-foreground">Agent Overview</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Agents are AI-powered assistants that can help with specific tasks and workflows.
              Configure the basics below to define their purpose and tone.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-500" />
                  Specialized
                </h4>
                <p className="text-sm text-muted-foreground">
                  Each agent is optimized for a specific workflow, making it more effective than a
                  general assistant.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-500" />
                  Orchestrated
                </h4>
                <p className="text-sm text-muted-foreground">
                  Combine multiple agents using @mentions or orchestration rules to tackle complex
                  tasks.
                </p>
              </div>
              <div className="space-y-3">
                <h4 className="font-medium text-foreground flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-500" />
                  Configurable
                </h4>
                <p className="text-sm text-muted-foreground">
                  Fine-tune behavior, tone, and capabilities to match the needs of your team.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="agent-name">Agent Name *</Label>
                <Input
                  id="agent-name"
                  value={overview.name}
                  onChange={(e) => {
                    setOverview((prev) => ({ ...prev, name: e.target.value }));
                    clearStepError('overview');
                  }}
                  placeholder="e.g., Research Assistant"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a clear, descriptive name for your agent.
                </p>
              </div>
              <div>
                <Label htmlFor="agent-icon">Avatar URL (optional)</Label>
                <Input
                  id="agent-icon"
                  value={overview.icon}
                  onChange={(e) => setOverview((prev) => ({ ...prev, icon: e.target.value }))}
                  placeholder="https://example.com/avatar.png"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Provide a custom avatar image URL.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Label htmlFor="agent-description">Description *</Label>
              <Textarea
                id="agent-description"
                value={overview.description}
                onChange={(e) => {
                  setOverview((prev) => ({ ...prev, description: e.target.value }));
                  clearStepError('overview');
                }}
                rows={4}
                placeholder="Describe what this agent specializes in and how it helps users..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Explain the primary responsibilities and skills of this agent.
              </p>
            </div>

            <div className="mt-6">
              <Label>Tags</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
                <Button variant="outline" onClick={addTag} className="gap-2">
                  <Hash className="w-4 h-4" />
                  Add
                </Button>
              </div>
              {overview.keywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {overview.keywords.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleNextStep} className="gap-2">
              Next: {STEP_NEXT_COPY.overview ?? STEP_LABELS.category}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </div>
      </StepperTabContent>

      <StepperTabContent stepId="category">
        <div className="max-w-4xl mx-auto space-y-6">
          {renderStepError('category')}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Choose Agent Category</h3>
            <p className="text-muted-foreground mb-6">
              Select the primary category that best describes your agent's purpose and capabilities.
              Tags for the selected category will be added automatically.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GuiAgentCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`border rounded-lg p-4 text-left transition-colors hover:border-primary ${
                    selectedCategory === category ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{CATEGORY_TITLES[category]}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {CATEGORY_DESCRIPTIONS[category]}
                      </p>
                    </div>
                    {selectedCategory === category && (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="mt-3">
                    <span className="text-xs font-medium text-muted-foreground uppercase">
                      Examples
                    </span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {GuiCategoryKeywordsMap[category]?.map((keyword) => (
                        <Badge key={keyword} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous: {STEP_PREV_COPY.category ?? STEP_LABELS.overview}
            </Button>
            <Button onClick={handleNextStep} className="gap-2">
              Next: {STEP_NEXT_COPY.category ?? STEP_LABELS['ai-config']}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </div>
      </StepperTabContent>

      <StepperTabContent stepId="ai-config">
        <div className="max-w-4xl mx-auto space-y-6">
          {renderStepError('ai-config')}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">System Prompt</h3>
            <p className="text-muted-foreground mb-3">
              Define or override the system prompt used by this agent.
            </p>
            <Textarea
              value={systemPrompt}
              onChange={(e) => {
                setSystemPrompt(e.target.value);
                clearStepError('ai-config');
              }}
              rows={8}
              placeholder="Enter the system prompt that guides your agent's behavior..."
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">LLM Bridge & Model</h3>
            <BridgeModelSettings
              config={effectiveBridgeConfig as ReadonlyPreset['llmBridgeConfig']}
              showModel
              showParameters
              onChange={(updates) => {
                if (updates.llmBridgeConfig) {
                  const cfg = updates.llmBridgeConfig as Record<string, unknown>;
                  const { bridgeId: nextBridgeId, ...rest } = cfg;
                  if (typeof nextBridgeId === 'string') {
                    setBridgeId(nextBridgeId);
                  }
                  setBridgeConfig((prev) => ({ ...prev, ...rest }));
                  clearStepError('ai-config');
                }
                if (updates.llmBridgeName) {
                  setBridgeId(updates.llmBridgeName);
                  clearStepError('ai-config');
                }
              }}
            />
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">MCP Tools</h3>
            <p className="text-muted-foreground mb-3">
              Select tools to enable for this agent. Connect or disconnect tools through the MCP
              manager.
            </p>
            <div className="space-y-2">
              {mcpLoading && <div className="text-sm text-muted-foreground">Loading tools...</div>}
              {!mcpLoading && (mcpList?.items?.length ?? 0) === 0 && (
                <div className="text-sm text-muted-foreground">No tools found.</div>
              )}
              {!mcpLoading && (mcpList?.items?.length ?? 0) > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {mcpList!.items.map((tool) => {
                    const badgeClass = getToolStatusClass(tool.status);
                    return (
                      <label
                        key={tool.id}
                        className={`flex items-start gap-3 border rounded-md p-3 cursor-pointer hover:bg-accent ${
                          selectedMcpIds.has(tool.id) ? 'border-primary' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedMcpIds.has(tool.id)}
                          onChange={() => toggleMcpSelection(tool.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tool.name}</span>
                            <span className={`text-xs rounded px-2 py-0.5 border ${badgeClass}`}>
                              {tool.status}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">
                            {tool.description}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous: {STEP_PREV_COPY['ai-config'] ?? STEP_LABELS.category}
            </Button>
            <Button onClick={handleNextStep} className="gap-2">
              Next: {STEP_NEXT_COPY['ai-config'] ?? STEP_LABELS.settings}
              <ArrowLeft className="w-4 h-4 rotate-180" />
            </Button>
          </div>
        </div>
      </StepperTabContent>

      <StepperTabContent stepId="settings">
        <div className="max-w-4xl mx-auto space-y-6">
          {renderStepError('settings')}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Agent Settings</h3>
            <p className="text-muted-foreground mb-6">
              Configure how your agent behaves and when it can be activated.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setStatus(option.id);
                    clearStepError('settings');
                  }}
                  className={`border rounded-lg p-4 text-left transition-colors hover:border-primary ${
                    status === option.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {option.id === 'active' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {option.id === 'idle' && <Clock className="w-4 h-4 text-orange-600" />}
                    {option.id === 'inactive' && <MinusCircle className="w-4 h-4 text-gray-600" />}
                    <span className="font-semibold text-foreground capitalize">{option.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{option.helper}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Export / Import</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label className="text-sm">Export Agent as JSON</Label>
                <div className="mt-2 flex gap-2">
                  <Button variant="outline" onClick={handleExport} className="gap-2">
                    <Wand2 className="w-4 h-4" />
                    Generate JSON
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigator.clipboard.writeText(exportJson)}
                    disabled={!exportJson}
                  >
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={exportJson}
                  onChange={(e) => setExportJson(e.target.value)}
                  placeholder="Generated JSON will appear here"
                  className="mt-3 h-40 font-mono"
                />
              </div>

              <div>
                <Label className="text-sm">Import Agent JSON</Label>
                <Textarea
                  value={importJson}
                  onChange={(e) => {
                    setImportJson(e.target.value);
                    setImportError('');
                  }}
                  placeholder="Paste exported agent JSON here"
                  className="mt-3 h-40 font-mono"
                />
                {importError && <p className="text-xs text-red-600 mt-2">{importError}</p>}
                <div className="flex gap-2 mt-3">
                  <Button variant="outline" onClick={handleApplyImport} className="gap-2">
                    Apply
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportJson('');
                      setImportError('');
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Configuration Summary</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Agent Name</Label>
                  <p className="font-medium">{overview.name || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Category</Label>
                  <p className="font-medium">{categoryDisplayName}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">LLM Bridge</Label>
                  <p className="font-medium">
                    {previewAgent?.preset.llmBridgeName || 'Not configured'}
                    {previewAgent?.preset.llmBridgeConfig?.model
                      ? ` · ${String(previewAgent.preset.llmBridgeConfig.model)}`
                      : ''}
                  </p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Initial Status</Label>
                  <div className="flex items-center gap-2">
                    {status === 'active' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {status === 'idle' && <Clock className="w-4 h-4 text-orange-600" />}
                    {status === 'inactive' && <MinusCircle className="w-4 h-4 text-gray-600" />}
                    <span className="font-medium capitalize">{status}</span>
                  </div>
                </div>
              </div>

              {overview.description && (
                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <p className="text-sm">{overview.description}</p>
                </div>
              )}

              {overview.keywords.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {overview.keywords.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <Label className="text-sm text-muted-foreground">Enabled MCP Tools</Label>
                {renderEnabledMcpBadges()}
              </div>
            </div>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={handlePrevStep} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Previous: {STEP_PREV_COPY.settings ?? STEP_LABELS['ai-config']}
            </Button>
            <div className="space-y-3 w-full">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}
              <Button
                data-testid="btn-submit-agent"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="gap-2"
              >
                <Wand2 className="w-4 h-4" />
                {isSubmitting ? 'Creating…' : 'Create Agent'}
              </Button>
            </div>
          </div>
        </div>
      </StepperTabContent>
    </StepperTabs>
  );
}

export default SubAgentCreate;
