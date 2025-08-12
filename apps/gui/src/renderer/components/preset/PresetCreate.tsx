import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import {
  ArrowLeft,
  Save,
  Brain,
  Database,
  Code,
  BarChart3,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Lightbulb,
  Wand2,
  Settings,
  Plus,
  X,
  Terminal,
  Globe,
  Wifi,
  Zap,
} from 'lucide-react';
import { CreatePreset, McpConfig, Preset } from '@agentos/core';
import { MCPToolCreate } from '../mcp/MCPToolCreate';

interface PresetCreateProps {
  onBack: () => void;
  onCreate: (preset: CreatePreset) => Promise<Preset>;
}

export function PresetCreate({ onBack, onCreate }: PresetCreateProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(1);
  const [showMCPDialog, setShowMCPDialog] = useState(false);
  const totalSteps = 4;

  // Form state
  const [formData, setFormData] = useState<CreatePreset>({
    name: '',
    description: '',
    author: '',
    category: ['research'],
    systemPrompt: '',
    status: 'active',
    llmBridgeName: 'default',
    llmBridgeConfig: {},
    version: '1.0.0',
  });

  // Available tools
  const availableTools = [
    {
      id: 'web_search',
      name: 'Web Search',
      description: 'Search the internet for information',
      category: 'research',
    },
    {
      id: 'arxiv',
      name: 'ArXiv',
      description: 'Search academic papers on ArXiv',
      category: 'research',
    },
    {
      id: 'scholar',
      name: 'Google Scholar',
      description: 'Search scholarly articles',
      category: 'research',
    },
    {
      id: 'code_execution',
      name: 'Code Execution',
      description: 'Execute code in various languages',
      category: 'development',
    },
    {
      id: 'git',
      name: 'Git Operations',
      description: 'Git repository operations',
      category: 'development',
    },
    {
      id: 'documentation',
      name: 'Documentation',
      description: 'Access programming documentation',
      category: 'development',
    },
    {
      id: 'grammar_check',
      name: 'Grammar Check',
      description: 'Check and correct grammar',
      category: 'creative',
    },
    {
      id: 'style_guide',
      name: 'Style Guide',
      description: 'Apply writing style guidelines',
      category: 'creative',
    },
    {
      id: 'data_viz',
      name: 'Data Visualization',
      description: 'Create charts and graphs',
      category: 'analytics',
    },
    {
      id: 'statistics',
      name: 'Statistical Analysis',
      description: 'Perform statistical calculations',
      category: 'analytics',
    },
    {
      id: 'python',
      name: 'Python Environment',
      description: 'Python code execution environment',
      category: 'analytics',
    },
  ];

  // Preset templates
  const presetTemplates = {
    research: {
      name: 'Research Assistant',
      description: 'Specialized in academic research and fact-checking',
      systemPrompt:
        'You are a research assistant specialized in academic research and fact-checking. You help users find reliable sources, analyze data, and provide evidence-based insights. Always cite your sources and maintain academic rigor.',
      parameters: { temperature: 0.3, maxTokens: 4000, topP: 0.9 },
      tools: ['web_search', 'arxiv', 'scholar'],
    },
    development: {
      name: 'Code Assistant',
      description: 'Expert in software development and debugging',
      systemPrompt:
        'You are a senior software engineer with expertise in multiple programming languages and frameworks. Help users write clean, efficient code, debug issues, and follow best practices. Provide detailed explanations and examples.',
      parameters: { temperature: 0.2, maxTokens: 8000, topP: 0.95 },
      tools: ['code_execution', 'git', 'documentation'],
    },
    creative: {
      name: 'Content Writer',
      description: 'Creative writing and content creation specialist',
      systemPrompt:
        'You are a creative writing expert with a talent for engaging content creation. Help users craft compelling copy, creative stories, and marketing content. Focus on clarity, engagement, and brand voice consistency.',
      parameters: { temperature: 0.8, maxTokens: 6000, topP: 0.9 },
      tools: ['grammar_check', 'style_guide', 'web_search'],
    },
    analytics: {
      name: 'Data Analyzer',
      description: 'Data analysis and visualization expert',
      systemPrompt:
        'You are a data scientist specialized in data analysis and visualization. Help users interpret data, create meaningful insights, and suggest actionable recommendations. Focus on statistical accuracy and clear communication.',
      parameters: { temperature: 0.1, maxTokens: 5000, topP: 0.8 },
      tools: ['data_viz', 'statistics', 'python'],
    },
  };

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleCategoryChange = (category: string) => {
    const template = presetTemplates[category as keyof typeof presetTemplates];
    if (template) {
      updateFormData({
        category: [category],
        name: template.name,
        description: template.description,
        systemPrompt: template.systemPrompt,
      });
    } else {
      updateFormData({ category: [category] });
    }
  };

  const handleToolToggle = (toolName: string) => {
    const newTools = formData.enabledMcps?.filter((mcp) =>
      mcp.enabledTools.some((tool) => tool.name === toolName)
    );

    updateFormData({
      enabledMcps: newTools,
    });
  };

  const handleAddMCPTool = (mcpConfig: McpConfig) => {
    updateFormData({
      enabledMcps: [
        ...(formData.enabledMcps || []),
        {
          enabledTools: [],
          enabledResources: [],
          enabledPrompts: [],
          ...mcpConfig,
        },
      ],
    });
    setShowMCPDialog(false);
  };

  const handleRemoveMCPTool = (index: number) => {
    updateFormData({
      enabledMcps: formData.enabledMcps?.filter((_, i) => i !== index) || [],
    });
  };

  const getMCPIcon = (type: string) => {
    switch (type) {
      case 'stdio':
        return <Terminal className="w-4 h-4" />;
      case 'streamableHttp':
        return <Globe className="w-4 h-4" />;
      case 'websocket':
        return <Wifi className="w-4 h-4" />;
      case 'sse':
        return <Zap className="w-4 h-4" />;
      default:
        return <Settings className="w-4 h-4" />;
    }
  };

  const handleCreate = () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      return; // Basic validation
    }

    onCreate(formData);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Database className="w-5 h-5" />;
      case 'development':
        return <Code className="w-5 h-5" />;
      case 'creative':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="gap-1 status-active">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="gap-1 status-idle">
            <Clock className="w-3 h-3" />
            Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="gap-1 status-inactive-subtle">
            <AlertCircle className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  const isFormValid = () => {
    return formData.name.trim() && formData.description.trim() && formData.systemPrompt.trim();
  };

  const getStepFromTab = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 1;
      case 'configuration':
        return 2;
      case 'tools':
        return 3;
      case 'knowledge':
        return 4;
      default:
        return 1;
    }
  };

  const getTabFromStep = (step: number) => {
    switch (step) {
      case 1:
        return 'overview';
      case 2:
        return 'configuration';
      case 3:
        return 'tools';
      case 4:
        return 'knowledge';
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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Presets
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                <div className="text-blue-600">
                  <Wand2 className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Create New Preset</h1>
                <p className="text-muted-foreground">
                  Configure AI agent behavior and capabilities
                </p>
              </div>
              {getStatusBadge(formData.status)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleCreate}
              disabled={!isFormValid()}
              className="gap-2"
              data-testid="btn-create-preset"
            >
              <Save className="w-4 h-4" />
              Create Preset
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
            <span className={currentStep >= 1 ? 'text-foreground font-medium' : ''}>
              Basic Info
            </span>
            <span className={currentStep >= 2 ? 'text-foreground font-medium' : ''}>
              Configuration
            </span>
            <span className={currentStep >= 3 ? 'text-foreground font-medium' : ''}>Tools</span>
            <span className={currentStep >= 4 ? 'text-foreground font-medium' : ''}>
              Knowledge Base
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Basic Info</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="pr-2">
                <TabsContent value="overview" className="h-full">
                  <div className="max-w-4xl mx-auto space-y-6">
                {/* Category Selection with Templates */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-foreground">Choose Template</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(presetTemplates).map(([key, template]) => (
                      <Card
                        key={key}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                          formData.category.includes(key) ? 'ring-2 ring-primary bg-primary/5' : ''
                        }`}
                        onClick={() => handleCategoryChange(key)}
                      >
                        <div className="flex flex-col items-center text-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(key)}
                          </div>
                          <div>
                            <h4 className="font-medium text-foreground capitalize">{key}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Basic Information */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Preset Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                          placeholder="Enter preset name"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Describe what this preset is designed for"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model">AI Model</Label>
                        <Select
                          value={formData.llmBridgeName}
                          onValueChange={(value) => updateFormData({ llmBridgeName: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="anthropic">Anthropic</SelectItem>
                            <SelectItem value="gemini">Google Gemini</SelectItem>
                            <SelectItem value="local">Local LLM</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status">Initial Status</Label>
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
                            <SelectItem value="active">Active (Auto-participates)</SelectItem>
                            <SelectItem value="idle">Idle (Mention only)</SelectItem>
                            <SelectItem value="inactive">Inactive (Disabled)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* System Prompt */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">System Prompt *</h3>
                  <Textarea
                    value={formData.systemPrompt}
                    onChange={(e) => updateFormData({ systemPrompt: e.target.value })}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Enter the system prompt that defines this preset's behavior and personality..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    This prompt defines how the AI agent will behave and respond. Be specific about
                    its role, expertise, and communication style.
                  </p>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <div></div>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Configuration
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
                </TabsContent>

                <TabsContent value="configuration" className="h-full">
                  <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Model Parameters</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Temperature</Label>
                        <span className="text-sm font-medium">
                          {formData.llmBridgeConfig.temperature}
                        </span>
                      </div>
                      <Slider
                        value={[formData.llmBridgeConfig.temperature]}
                        onValueChange={([value]) =>
                          updateFormData({
                            llmBridgeConfig: { ...formData.llmBridgeConfig, temperature: value },
                          })
                        }
                        max={1}
                        min={0}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controls randomness: 0 = focused, 1 = creative
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Max Tokens</Label>
                        <span className="text-sm font-medium">
                          {formData.llmBridgeConfig.maxTokens}
                        </span>
                      </div>
                      <Slider
                        value={[formData.llmBridgeConfig.maxTokens]}
                        onValueChange={([value]) =>
                          updateFormData({
                            llmBridgeConfig: { ...formData.llmBridgeConfig, maxTokens: value },
                          })
                        }
                        max={8000}
                        min={100}
                        step={100}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Maximum response length</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Top P</Label>
                        <span className="text-sm font-medium">{formData.llmBridgeConfig.topP}</span>
                      </div>
                      <Slider
                        value={[formData.llmBridgeConfig.topP]}
                        onValueChange={([value]) =>
                          updateFormData({
                            llmBridgeConfig: { ...formData.llmBridgeConfig, topP: value },
                          })
                        }
                        max={1}
                        min={0}
                        step={0.1}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Controls diversity of word choices
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Basic Info
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Tools
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="h-full">
                  <div className="max-w-4xl mx-auto space-y-6">
                {/* Built-in Tools */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Built-in Tools</h3>
                  <p className="text-muted-foreground mb-6">
                    Select the built-in tools and capabilities this preset should have access to.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableTools
                      .filter(
                        (tool) =>
                          formData.category.includes(tool.category) ||
                          formData.category.includes('research')
                      )
                      .map((tool) => (
                        <Card
                          key={tool.id}
                          className={`p-4 cursor-pointer transition-all hover:shadow-sm ${
                            formData.enabledMcps?.some((mcp) =>
                              mcp.enabledTools.some((enabledTool) => enabledTool.name === tool.name)
                            )
                              ? 'ring-1 ring-primary bg-primary/5'
                              : ''
                          }`}
                          onClick={() => handleToolToggle(tool.name)}
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={formData.enabledMcps?.some((mcp) =>
                                mcp.enabledTools.some(
                                  (enabledTool) => enabledTool.name === tool.name
                                )
                              )}
                              onChange={() => handleToolToggle(tool.name)}
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{tool.name}</h4>
                              <p className="text-sm text-muted-foreground">{tool.description}</p>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>

                  {formData.enabledMcps && formData.enabledMcps.length > 0 && (
                    <div className="mt-6 p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">
                        Selected Built-in Tools ({formData.enabledMcps.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {formData.enabledMcps.map((mcp) => {
                          const tool = availableTools.find((t) => t.id === mcp.name);
                          return (
                            <Badge key={mcp.name} variant="outline" className="bg-white">
                              {tool?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </Card>

                {/* MCP Tools */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">MCP Tools</h3>
                      <p className="text-muted-foreground text-sm">
                        Add Model Context Protocol tools for extended functionality.
                      </p>
                    </div>
                    <Button onClick={() => setShowMCPDialog(true)} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add MCP Tool
                    </Button>
                  </div>

                  {formData.enabledMcps && formData.enabledMcps.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                      <Settings className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-medium text-foreground mb-2">No MCP Tools Added</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        MCP tools provide external functionality through standardized protocols.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShowMCPDialog(true)}
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Your First MCP Tool
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.enabledMcps &&
                        formData.enabledMcps.map((mcpTool, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                  {getMCPIcon(mcpTool.name)}
                                </div>
                                <div>
                                  <h4 className="font-medium text-foreground">{mcpTool.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Badge variant="outline" className="text-xs">
                                      {mcpTool.name}
                                    </Badge>
                                    <span>v{mcpTool.version}</span>
                                    {mcpTool.name === 'stdio' && (
                                      <span className="font-mono text-xs">
                                        {(mcpTool as any).command}
                                      </span>
                                    )}
                                    {(mcpTool.name === 'streamableHttp' ||
                                      mcpTool.name === 'websocket' ||
                                      mcpTool.name === 'sse') && (
                                      <span className="font-mono text-xs">
                                        {(mcpTool as any).url}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMCPTool(index)}
                                className="gap-1 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                              >
                                <X className="w-3 h-3" />
                                Remove
                              </Button>
                            </div>
                          </Card>
                        ))}
                    </div>
                  )}
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Configuration
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Knowledge Base
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
                  </div>
                </TabsContent>

                <TabsContent value="knowledge" className="h-full">
                  <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Knowledge Base (Optional)
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    You can add knowledge documents after creating the preset.
                  </p>

                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h4 className="font-medium text-foreground mb-2">No Knowledge Documents Yet</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload documents, PDFs, or text files to enhance this preset's knowledge.
                    </p>
                    <Button variant="outline" disabled>
                      Upload Documents
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Available after preset creation
                    </p>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Tools
                  </Button>
                  <Button onClick={handleCreate} disabled={!isFormValid()} className="gap-2">
                    <Save className="w-4 h-4" />
                    Create Preset
                  </Button>
                </div>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>

      {/* MCP Tool Add Dialog */}
      <MCPToolCreate onBack={() => setShowMCPDialog(false)} onCreate={handleAddMCPTool} />
    </div>
  );
}
