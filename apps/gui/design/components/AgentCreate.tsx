import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { ScrollArea } from './ui/scroll-area';
import { Switch } from './ui/switch';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import {
  ArrowLeft,
  Save,
  Bot,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  MinusCircle,
  Zap,
  Database,
  Search,
  User,
  Users,
  Sparkles,
  Info,
  Star,
  Target,
  Palette,
  Hash,
  Plus,
  X,
  Wand2,
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  status: 'active' | 'idle' | 'inactive';
  preset: string;
  avatar?: string;
  lastUsed?: Date;
  usageCount: number;
  tags?: string[];
}

interface Preset {
  id: string;
  name: string;
  description: string;
  category: string;
  model: string;
  systemPrompt: string;
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
  tools: string[];
  mcpTools?: any[];
  status: 'active' | 'idle' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  knowledgeDocuments: number;
  knowledgeStats?: {
    indexed: number;
    vectorized: number;
    totalSize: number;
  };
}

interface AgentCreateProps {
  onBack: () => void;
  onCreate: (agent: Omit<Agent, 'id' | 'usageCount' | 'lastUsed'>) => Agent;
  presets: Preset[];
}

export function AgentCreate({ onBack, onCreate, presets }: AgentCreateProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    status: 'active' as 'active' | 'idle' | 'inactive',
    preset: '',
    avatar: '',
    tags: [] as string[],
  });

  // Tags management
  const [newTag, setNewTag] = useState('');

  // Agent categories with descriptions and icons
  const agentCategories = [
    {
      id: 'research',
      name: 'Research',
      description: 'Information gathering, fact-checking, and analysis',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-blue-100 text-blue-700',
      examples: ['Academic Research', 'Market Analysis', 'Fact Checker'],
    },
    {
      id: 'development',
      name: 'Development',
      description: 'Code writing, debugging, and software engineering',
      icon: <Bot className="w-5 h-5" />,
      color: 'bg-green-100 text-green-700',
      examples: ['Code Assistant', 'Debug Helper', 'Architecture Advisor'],
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Content creation, writing, and creative tasks',
      icon: <Palette className="w-5 h-5" />,
      color: 'bg-purple-100 text-purple-700',
      examples: ['Content Writer', 'Copywriter', 'Creative Director'],
    },
    {
      id: 'analytics',
      name: 'Analytics',
      description: 'Data analysis, visualization, and insights',
      icon: <Database className="w-5 h-5" />,
      color: 'bg-orange-100 text-orange-700',
      examples: ['Data Analyst', 'Business Intelligence', 'Report Generator'],
    },
    {
      id: 'customer',
      name: 'Customer Support',
      description: 'Customer service, support, and engagement',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-pink-100 text-pink-700',
      examples: ['Support Agent', 'FAQ Assistant', 'Customer Success'],
    },
    {
      id: 'general',
      name: 'General Purpose',
      description: 'Versatile assistant for various tasks',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'bg-gray-100 text-gray-700',
      examples: ['Personal Assistant', 'Task Manager', 'General Helper'],
    },
  ];

  // Preset templates grouped by category
  const presetsByCategory = presets.reduce(
    (acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = [];
      }
      acc[preset.category].push(preset);
      return acc;
    },
    {} as Record<string, Preset[]>
  );

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      updateFormData({
        tags: [...formData.tags, newTag.trim()],
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    updateFormData({
      tags: formData.tags.filter((tag) => tag !== tagToRemove),
    });
  };

  const handleCreate = () => {
    if (!isFormValid()) return;

    const newAgent: Omit<Agent, 'id' | 'usageCount' | 'lastUsed'> = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      status: formData.status,
      preset: formData.preset,
      avatar: formData.avatar || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
    };

    onCreate(newAgent);
  };

  const isFormValid = () => {
    return formData.name.trim() && formData.description.trim() && formData.preset;
  };

  const getStepFromTab = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 1;
      case 'category':
        return 2;
      case 'preset':
        return 3;
      case 'settings':
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
        return 'category';
      case 3:
        return 'preset';
      case 4:
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

  const selectedCategory = agentCategories.find((cat) => cat.id === formData.category);
  const selectedPreset = presets.find((preset) => preset.id === formData.preset);

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
            <Button onClick={handleCreate} disabled={!isFormValid()} className="gap-2">
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
            <span className={currentStep >= 4 ? 'text-foreground font-medium' : ''}>Settings</span>
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
                          value={formData.avatar}
                          onChange={(e) =>
                            updateFormData({
                              avatar: e.target.value,
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
                          {formData.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {formData.tags.map((tag, index) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {agentCategories.map((category) => (
                      <Card
                        key={category.id}
                        className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                          formData.category === category.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() =>
                          updateFormData({
                            category: category.id,
                          })
                        }
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${category.color}`}
                            >
                              {category.icon}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground">{category.name}</h4>
                              {formData.category === category.id && (
                                <div className="flex items-center gap-1 text-xs text-primary">
                                  <CheckCircle className="w-3 h-3" />
                                  Selected
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{category.description}</p>
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Examples:</p>
                            <div className="flex flex-wrap gap-1">
                              {category.examples.map((example, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {example}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Overview
                  </Button>
                  <Button onClick={handleNextStep} className="gap-2">
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

                  {selectedCategory && (
                    <Alert className="mb-6">
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Showing presets for <strong>{selectedCategory.name}</strong> category. You
                        can also choose presets from other categories if they better match your
                        needs.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-6">
                    {Object.entries(presetsByCategory).map(([category, categoryPresets]) => (
                      <div key={category}>
                        <h4 className="font-medium text-foreground mb-3 capitalize flex items-center gap-2">
                          {agentCategories.find((cat) => cat.id === category)?.icon}
                          {agentCategories.find((cat) => cat.id === category)?.name ||
                            category}{' '}
                          Presets
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryPresets.map((preset) => (
                            <Card
                              key={preset.id}
                              className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                                formData.preset === preset.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/50'
                              }`}
                              onClick={() =>
                                updateFormData({
                                  preset: preset.id,
                                })
                              }
                            >
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h5 className="font-medium text-foreground">{preset.name}</h5>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {preset.description}
                                    </p>
                                  </div>
                                  {formData.preset === preset.id && (
                                    <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                  )}
                                </div>

                                <div className="space-y-2 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Model:</span>
                                    <span className="font-medium">{preset.model}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tools:</span>
                                    <span className="font-medium">{preset.tools.length} tools</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Usage:</span>
                                    <span className="font-medium">{preset.usageCount} times</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant={
                                      preset.status === 'active'
                                        ? 'default'
                                        : preset.status === 'idle'
                                          ? 'secondary'
                                          : 'outline'
                                    }
                                    className="text-xs"
                                  >
                                    {preset.status}
                                  </Badge>
                                  {preset.usageCount > 100 && (
                                    <Badge variant="outline" className="text-xs gap-1">
                                      <Star className="w-3 h-3" />
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Category
                  </Button>
                  <Button onClick={handleNextStep} disabled={!formData.preset} className="gap-2">
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
                        <p className="font-medium capitalize">
                          {selectedCategory?.name || formData.category}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground">Base Preset</Label>
                        <p className="font-medium">{selectedPreset?.name || 'Not selected'}</p>
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

                    {formData.tags.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Tags</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {formData.tags.map((tag, index) => (
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
                  <Button onClick={handleCreate} disabled={!isFormValid()} className="gap-2">
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
