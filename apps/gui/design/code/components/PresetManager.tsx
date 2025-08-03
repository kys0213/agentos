import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  Search,
  Filter,
  Settings,
  Bot,
  Code,
  Layers,
  Calendar,
  User,
  ChevronRight,
  ChevronLeft,
  Save,
  X,
  Upload,
  Download,
  Eye,
  Wrench,
  Cpu,
  FileText,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Types based on the provided interface
interface Preset {
  id: string;
  name: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  version: string;
  systemPrompt: string;
  enabledMcps?: EnabledMcp[];
  llmBridgeName: string;
  llmBridgeConfig: Record<string, any>;
}

interface EnabledMcp {
  name: string;
  version?: string;
  enabledTools: string[];
  enabledResources: string[];
  enabledPrompts: string[];
}

interface McpProvider {
  name: string;
  version: string;
  description: string;
  tools: string[];
  resources: string[];
  prompts: string[];
  status: 'connected' | 'disconnected' | 'error';
}

interface LlmBridge {
  name: string;
  displayName: string;
  description: string;
  configSchema: any;
  capabilities: string[];
  status: 'available' | 'configured' | 'error';
}

export function PresetManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [createStep, setCreateStep] = useState(1);

  // Mock data
  const presets: Preset[] = [
    {
      id: 'preset-1',
      name: 'Data Analysis Expert',
      description:
        'Specialized agent for advanced data analysis, visualization, and statistical insights',
      author: 'System',
      createdAt: new Date(2024, 11, 10),
      updatedAt: new Date(2024, 11, 15),
      version: '1.2.0',
      systemPrompt:
        'You are a data analysis expert with extensive experience in statistical analysis, data visualization, and machine learning. Help users understand their data through clear explanations and actionable insights.',
      enabledMcps: [
        {
          name: 'data-toolkit',
          version: '1.0.0',
          enabledTools: ['csv_reader', 'data_visualizer', 'statistical_analyzer'],
          enabledResources: ['sample_datasets', 'templates'],
          enabledPrompts: ['analyze_data', 'create_chart'],
        },
      ],
      llmBridgeName: 'openai-gpt4',
      llmBridgeConfig: { temperature: 0.3, maxTokens: 4000 },
    },
    {
      id: 'preset-2',
      name: 'Code Review Specialist',
      description:
        'Expert code reviewer focused on best practices, security, and performance optimization',
      author: 'Dev Team',
      createdAt: new Date(2024, 11, 8),
      updatedAt: new Date(2024, 11, 12),
      version: '1.1.0',
      systemPrompt:
        'You are a senior software engineer specializing in code review. Focus on code quality, security vulnerabilities, performance optimizations, and best practices. Provide constructive feedback with specific improvement suggestions.',
      enabledMcps: [
        {
          name: 'code-tools',
          version: '2.1.0',
          enabledTools: ['syntax_checker', 'security_scanner', 'performance_analyzer'],
          enabledResources: ['coding_standards', 'security_guidelines'],
          enabledPrompts: ['review_code', 'suggest_improvements'],
        },
      ],
      llmBridgeName: 'claude-sonnet',
      llmBridgeConfig: { temperature: 0.1, maxTokens: 8000 },
    },
    {
      id: 'preset-3',
      name: 'Creative Writer',
      description: 'AI assistant for creative writing, storytelling, and content creation',
      author: 'Content Team',
      createdAt: new Date(2024, 11, 5),
      updatedAt: new Date(2024, 11, 14),
      version: '1.0.3',
      systemPrompt:
        'You are a creative writing assistant with expertise in storytelling, character development, and various writing styles. Help users craft compelling narratives, improve their writing, and overcome creative blocks.',
      enabledMcps: [
        {
          name: 'writing-suite',
          version: '1.5.0',
          enabledTools: ['grammar_checker', 'style_analyzer', 'word_counter'],
          enabledResources: ['writing_prompts', 'style_guides'],
          enabledPrompts: ['improve_text', 'generate_ideas'],
        },
      ],
      llmBridgeName: 'openai-gpt4',
      llmBridgeConfig: { temperature: 0.8, maxTokens: 6000 },
    },
  ];

  const mcpProviders: McpProvider[] = [
    {
      name: 'data-toolkit',
      version: '1.0.0',
      description: 'Comprehensive data analysis and visualization tools',
      tools: ['csv_reader', 'data_visualizer', 'statistical_analyzer', 'ml_predictor'],
      resources: ['sample_datasets', 'templates', 'documentation'],
      prompts: ['analyze_data', 'create_chart', 'generate_insights'],
      status: 'connected',
    },
    {
      name: 'code-tools',
      version: '2.1.0',
      description: 'Development and code analysis utilities',
      tools: ['syntax_checker', 'security_scanner', 'performance_analyzer', 'test_generator'],
      resources: ['coding_standards', 'security_guidelines', 'best_practices'],
      prompts: ['review_code', 'suggest_improvements', 'write_tests'],
      status: 'connected',
    },
    {
      name: 'writing-suite',
      version: '1.5.0',
      description: 'Creative writing and content creation tools',
      tools: ['grammar_checker', 'style_analyzer', 'word_counter', 'plagiarism_checker'],
      resources: ['writing_prompts', 'style_guides', 'templates'],
      prompts: ['improve_text', 'generate_ideas', 'check_grammar'],
      status: 'connected',
    },
    {
      name: 'web-research',
      version: '0.9.0',
      description: 'Web research and information gathering tools',
      tools: ['web_scraper', 'search_engine', 'fact_checker'],
      resources: ['search_templates', 'source_validation'],
      prompts: ['research_topic', 'fact_check', 'summarize_sources'],
      status: 'disconnected',
    },
  ];

  const llmBridges: LlmBridge[] = [
    {
      name: 'openai-gpt4',
      displayName: 'OpenAI GPT-4',
      description: 'Latest GPT-4 model with advanced reasoning capabilities',
      configSchema: {
        apiKey: { type: 'string', required: true, label: 'API Key' },
        temperature: { type: 'number', min: 0, max: 2, default: 0.7, label: 'Temperature' },
        maxTokens: { type: 'number', min: 1, max: 8000, default: 4000, label: 'Max Tokens' },
      },
      capabilities: ['text-generation', 'code-generation', 'analysis', 'reasoning'],
      status: 'configured',
    },
    {
      name: 'claude-sonnet',
      displayName: 'Claude 3.5 Sonnet',
      description: "Anthropic's Claude model optimized for reasoning and analysis",
      configSchema: {
        apiKey: { type: 'string', required: true, label: 'API Key' },
        temperature: { type: 'number', min: 0, max: 1, default: 0.3, label: 'Temperature' },
        maxTokens: { type: 'number', min: 1, max: 8000, default: 4000, label: 'Max Tokens' },
      },
      capabilities: ['text-generation', 'analysis', 'reasoning', 'code-generation'],
      status: 'configured',
    },
    {
      name: 'local-llama',
      displayName: 'Local Llama 3.1',
      description: 'Self-hosted Llama model for privacy-focused applications',
      configSchema: {
        endpoint: { type: 'string', required: true, label: 'Endpoint URL' },
        temperature: { type: 'number', min: 0, max: 2, default: 0.7, label: 'Temperature' },
        maxTokens: { type: 'number', min: 1, max: 4000, default: 2000, label: 'Max Tokens' },
      },
      capabilities: ['text-generation', 'code-generation'],
      status: 'available',
    },
  ];

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return 'bg-green-500';
      case 'available':
        return 'bg-blue-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Preset Manager</h1>
          <p className="text-muted-foreground">
            Create and manage AI agent presets with custom prompts and capabilities
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setShowCreateDialog(true);
              setCreateStep(1);
            }}
          >
            <Plus className="w-4 h-4" />
            Create Preset
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Presets</p>
              <p className="text-xl font-semibold">{presets.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <Wrench className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active MCPs</p>
              <p className="text-xl font-semibold">
                {mcpProviders.filter((m) => m.status === 'connected').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Cpu className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">LLM Bridges</p>
              <p className="text-xl font-semibold">
                {llmBridges.filter((l) => l.status === 'configured').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <User className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Authors</p>
              <p className="text-xl font-semibold">{new Set(presets.map((p) => p.author)).size}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPresets.map((preset) => (
          <Card key={preset.id} className="p-6">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{preset.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      v{preset.version} by {preset.author}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground line-clamp-2">{preset.description}</p>

              {/* LLM Bridge */}
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">
                  {llmBridges.find((b) => b.name === preset.llmBridgeName)?.displayName}
                </span>
              </div>

              {/* MCP Tools */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">MCP Tools</p>
                <div className="flex flex-wrap gap-1">
                  {preset.enabledMcps?.slice(0, 3).map((mcp, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {mcp.name}
                    </Badge>
                  ))}
                  {preset.enabledMcps && preset.enabledMcps.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{preset.enabledMcps.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t text-xs text-muted-foreground">
                <div>
                  <p>Created: {formatDate(preset.createdAt)}</p>
                </div>
                <div>
                  <p>Updated: {formatDate(preset.updatedAt)}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setSelectedPreset(preset);
                    setShowEditDialog(true);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Configure
                </Button>
                <Button variant="outline" size="sm">
                  <Copy className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Preset Dialog - Improved with fixed navigation */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-2 border-b">
            <DialogTitle>Create New Preset</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-hidden">
            <CreatePresetWizard
              step={createStep}
              onStepChange={setCreateStep}
              onClose={() => setShowCreateDialog(false)}
              mcpProviders={mcpProviders}
              llmBridges={llmBridges}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Preset Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Preset: {selectedPreset?.name}</DialogTitle>
          </DialogHeader>
          {selectedPreset && (
            <EditPresetForm
              preset={selectedPreset}
              onClose={() => setShowEditDialog(false)}
              mcpProviders={mcpProviders}
              llmBridges={llmBridges}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Empty State */}
      {filteredPresets.length === 0 && (
        <div className="text-center py-12">
          <Layers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">No presets found</p>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery
              ? 'Try adjusting your search query'
              : 'Create your first preset to get started'}
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Preset
          </Button>
        </div>
      )}
    </div>
  );
}

// Create Preset Wizard Component - Improved layout
function CreatePresetWizard({
  step,
  onStepChange,
  onClose,
  mcpProviders,
  llmBridges,
}: {
  step: number;
  onStepChange: (step: number) => void;
  onClose: () => void;
  mcpProviders: McpProvider[];
  llmBridges: LlmBridge[];
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    author: '',
    systemPrompt: '',
    selectedMcps: [] as EnabledMcp[],
    llmBridgeName: '',
    llmBridgeConfig: {},
  });

  const steps = [
    { id: 1, title: 'Basic Info', icon: FileText },
    { id: 2, title: 'System Prompt', icon: Code },
    { id: 3, title: 'MCP Tools', icon: Wrench },
    { id: 4, title: 'LLM Bridge', icon: Cpu },
    { id: 5, title: 'Review', icon: CheckCircle2 },
  ];

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.description && formData.author;
      case 2:
        return formData.systemPrompt;
      case 3:
        return true; // MCP selection is optional
      case 4:
        return formData.llmBridgeName;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Preset Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Data Analysis Expert"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this preset is designed for..."
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="Your name or team"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="systemPrompt">System Prompt</Label>
              <Textarea
                id="systemPrompt"
                value={formData.systemPrompt}
                onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                placeholder="You are an AI assistant that..."
                rows={12}
                className="font-mono text-sm resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Define the agent's role, expertise, and behavior. This prompt will guide all
                interactions.
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select MCP providers and their tools to enhance your agent's capabilities.
            </p>

            <div className="space-y-4">
              {mcpProviders.map((mcp) => (
                <Card key={mcp.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={formData.selectedMcps.some((m) => m.name === mcp.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFormData({
                                ...formData,
                                selectedMcps: [
                                  ...formData.selectedMcps,
                                  {
                                    name: mcp.name,
                                    version: mcp.version,
                                    enabledTools: [],
                                    enabledResources: [],
                                    enabledPrompts: [],
                                  },
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                selectedMcps: formData.selectedMcps.filter(
                                  (m) => m.name !== mcp.name
                                ),
                              });
                            }
                          }}
                        />
                        <div>
                          <h4 className="font-medium">{mcp.name}</h4>
                          <p className="text-sm text-muted-foreground">{mcp.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 ${mcp.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                        ></div>
                        <Badge variant="outline" className="text-xs">
                          {mcp.version}
                        </Badge>
                      </div>
                    </div>

                    {formData.selectedMcps.some((m) => m.name === mcp.name) && (
                      <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                        <div>
                          <Label className="text-xs font-medium">Tools</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mcp.tools.map((tool) => (
                              <Badge
                                key={tool}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                              >
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs font-medium">Resources</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mcp.resources.map((resource) => (
                              <Badge
                                key={resource}
                                variant="secondary"
                                className="text-xs cursor-pointer"
                              >
                                {resource}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label>Select LLM Bridge</Label>
              <div className="grid gap-3 mt-2">
                {llmBridges.map((bridge) => (
                  <Card
                    key={bridge.name}
                    className={`p-4 cursor-pointer transition-colors ${
                      formData.llmBridgeName === bridge.name ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => setFormData({ ...formData, llmBridgeName: bridge.name })}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 ${getStatusColor(bridge.status)} rounded-full`}
                        ></div>
                        <div>
                          <h4 className="font-medium">{bridge.displayName}</h4>
                          <p className="text-sm text-muted-foreground">{bridge.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {bridge.status}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {formData.llmBridgeName && (
              <div className="space-y-3">
                <Label>Bridge Configuration</Label>
                <Card className="p-4">
                  <div className="grid gap-3">
                    <div>
                      <Label className="text-sm">Temperature</Label>
                      <Input
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        defaultValue="0.7"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Max Tokens</Label>
                      <Input
                        type="number"
                        min="1"
                        max="8000"
                        defaultValue="4000"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold">Review Your Preset</h3>
              <p className="text-sm text-muted-foreground">
                Please review the configuration before creating the preset.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span> {formData.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Author:</span> {formData.author}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">System Prompt</h4>
                <div className="bg-gray-50 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                  {formData.systemPrompt}
                </div>
              </Card>

              <Card className="p-4">
                <h4 className="font-medium mb-2">Configuration</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">LLM Bridge:</span>{' '}
                    {llmBridges.find((b) => b.name === formData.llmBridgeName)?.displayName}
                  </div>
                  <div>
                    <span className="text-muted-foreground">MCP Tools:</span>{' '}
                    {formData.selectedMcps.length
                      ? formData.selectedMcps.map((m) => m.name).join(', ')
                      : 'None'}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
        return 'bg-green-500';
      case 'available':
        return 'bg-blue-500';
      case 'disconnected':
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Step Progress - Fixed Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span
                  className={`ml-2 text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}
                >
                  {s.title}
                </span>
                {index < steps.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400 mx-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-6 py-6">{renderStep()}</div>

      {/* Navigation - Fixed Footer */}
      <div className="px-6 py-4 border-t bg-white">
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => (step > 1 ? onStepChange(step - 1) : onClose())}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {step > 1 ? 'Previous' : 'Cancel'}
          </Button>

          <Button
            onClick={() => (step < 5 ? onStepChange(step + 1) : onClose())}
            disabled={!canProceed()}
          >
            {step < 5 ? (
              <>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </>
            ) : (
              <>
                Create Preset <Save className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Edit Preset Form Component
function EditPresetForm({
  preset,
  onClose,
  mcpProviders,
  llmBridges,
}: {
  preset: Preset;
  onClose: () => void;
  mcpProviders: McpProvider[];
  llmBridges: LlmBridge[];
}) {
  const [activeTab, setActiveTab] = useState('basic');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="basic">Basic Info</TabsTrigger>
        <TabsTrigger value="prompt">System Prompt</TabsTrigger>
        <TabsTrigger value="mcps">MCP Tools</TabsTrigger>
        <TabsTrigger value="llm">LLM Bridge</TabsTrigger>
      </TabsList>

      <div className="mt-6">
        <TabsContent value="basic" className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Preset Name</Label>
            <Input id="edit-name" defaultValue={preset.name} />
          </div>
          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea id="edit-description" defaultValue={preset.description} rows={3} />
          </div>
          <div>
            <Label htmlFor="edit-author">Author</Label>
            <Input id="edit-author" defaultValue={preset.author} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-version">Version</Label>
              <Input id="edit-version" defaultValue={preset.version} />
            </div>
            <div>
              <Label>Last Updated</Label>
              <Input value={preset.updatedAt.toLocaleDateString()} disabled />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <div>
            <Label htmlFor="edit-prompt">System Prompt</Label>
            <Textarea
              id="edit-prompt"
              defaultValue={preset.systemPrompt}
              rows={15}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Define the agent's role, expertise, and behavior.
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button variant="outline" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="mcps" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configure MCP providers and their enabled tools for this preset.
          </p>

          {/* Similar to step 3 of create wizard but with preset.enabledMcps as initial state */}
          <div className="space-y-4">
            {mcpProviders.map((mcp) => {
              const isEnabled = preset.enabledMcps?.some((m) => m.name === mcp.name);
              const enabledMcp = preset.enabledMcps?.find((m) => m.name === mcp.name);

              return (
                <Card key={mcp.name} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox checked={isEnabled} />
                        <div>
                          <h4 className="font-medium">{mcp.name}</h4>
                          <p className="text-sm text-muted-foreground">{mcp.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 ${mcp.status === 'connected' ? 'bg-green-500' : 'bg-red-500'} rounded-full`}
                        ></div>
                        <Badge variant="outline" className="text-xs">
                          {mcp.version}
                        </Badge>
                      </div>
                    </div>

                    {isEnabled && enabledMcp && (
                      <div className="ml-6 space-y-3 border-l-2 border-border pl-4">
                        <div>
                          <Label className="text-xs font-medium">Enabled Tools</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {mcp.tools.map((tool) => (
                              <Badge
                                key={tool}
                                variant={
                                  enabledMcp.enabledTools.includes(tool) ? 'default' : 'secondary'
                                }
                                className="text-xs cursor-pointer"
                              >
                                {tool}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="llm" className="space-y-4">
          <div>
            <Label>LLM Bridge</Label>
            <Select defaultValue={preset.llmBridgeName}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {llmBridges.map((bridge) => (
                  <SelectItem key={bridge.name} value={bridge.name}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 bg-green-500 rounded-full`}></div>
                      {bridge.displayName}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Configuration</Label>
            <Card className="p-4 mt-2">
              <div className="grid gap-3">
                <div>
                  <Label className="text-sm">Temperature</Label>
                  <Input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    defaultValue={preset.llmBridgeConfig.temperature || 0.7}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm">Max Tokens</Label>
                  <Input
                    type="number"
                    min="1"
                    max="8000"
                    defaultValue={preset.llmBridgeConfig.maxTokens || 4000}
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </div>

      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Test Preset
          </Button>
          <Button>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </Tabs>
  );
}
