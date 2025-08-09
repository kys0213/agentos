import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Settings,
  Bot,
  Brain,
  Zap,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Search,
  Database,
  Code,
  FileText,
  Globe,
  BarChart3,
} from 'lucide-react';

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
  status: 'active' | 'draft';
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  knowledgeDocuments: number;
}

interface DynamicFormRendererProps {
  preset?: Preset;
  isCreateMode?: boolean;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
}

interface Tool {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

export function DynamicFormRenderer({
  preset,
  isCreateMode = false,
  currentStep = 1,
  onStepChange,
  onComplete,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Partial<Preset>>({
    name: preset?.name || '',
    description: preset?.description || '',
    category: preset?.category || 'general',
    model: preset?.model || 'gpt-4',
    systemPrompt: preset?.systemPrompt || '',
    parameters: {
      temperature: preset?.parameters?.temperature || 0.7,
      maxTokens: preset?.parameters?.maxTokens || 2048,
      topP: preset?.parameters?.topP || 1.0,
    },
    tools: preset?.tools || [],
    status: preset?.status || 'draft',
  });

  const [selectedTools, setSelectedTools] = useState<string[]>(preset?.tools || []);

  const availableTools: Tool[] = [
    {
      id: 'web-search',
      name: 'Web Search',
      description: 'Search the web for current information',
      icon: <Globe className="w-4 h-4" />,
    },
    {
      id: 'code-executor',
      name: 'Code Executor',
      description: 'Execute code snippets safely',
      icon: <Code className="w-4 h-4" />,
    },
    {
      id: 'database-query',
      name: 'Database Query',
      description: 'Query databases for information',
      icon: <Database className="w-4 h-4" />,
    },
    {
      id: 'file-processor',
      name: 'File Processor',
      description: 'Process various file formats',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'analytics-api',
      name: 'Analytics API',
      description: 'Advanced data analysis tools',
      icon: <BarChart3 className="w-4 h-4" />,
    },
  ];

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'research', label: 'Research' },
    { value: 'development', label: 'Development' },
    { value: 'creative', label: 'Creative' },
    { value: 'analytics', label: 'Analytics' },
  ];

  const models = [
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'claude-3', label: 'Claude 3' },
    { value: 'local-model', label: 'Local Model' },
  ];

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateParameters = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      parameters: {
        ...prev.parameters!,
        [field]: value,
      },
    }));
  };

  const toggleTool = (toolId: string) => {
    const newTools = selectedTools.includes(toolId)
      ? selectedTools.filter((id) => id !== toolId)
      : [...selectedTools, toolId];
    setSelectedTools(newTools);
    updateFormData('tools', newTools);
  };

  const handleSave = () => {
    // Here you would typically save the preset data
    console.log('Saving preset:', formData);
    if (onComplete) {
      onComplete();
    }
  };

  const nextStep = () => {
    if (onStepChange && currentStep < 5) {
      onStepChange(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (onStepChange && currentStep > 1) {
      onStepChange(currentStep - 1);
    }
  };

  // Render create wizard steps
  if (isCreateMode) {
    return (
      <div className="space-y-6">
        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
                  step === currentStep
                    ? 'bg-primary text-primary-foreground'
                    : step < currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? <CheckCircle className="w-4 h-4" /> : step}
              </div>
              {step < 5 && (
                <ArrowRight
                  className={`w-4 h-4 mx-2 ${
                    step < currentStep ? 'text-green-500' : 'text-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <Card className="p-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Preset Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    placeholder="e.g., Research Assistant"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    placeholder="Describe what this agent specializes in..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => updateFormData('category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Model Configuration</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Model</Label>
                  <Select
                    value={formData.model}
                    onValueChange={(value) => updateFormData('model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.value} value={model.value}>
                          {model.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">System Prompt</h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>System Instructions</Label>
                  <Textarea
                    value={formData.systemPrompt}
                    onChange={(e) => updateFormData('systemPrompt', e.target.value)}
                    placeholder="You are a helpful assistant that..."
                    className="min-h-[200px]"
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Available Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTools.includes(tool.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedTools.includes(tool.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100'
                        }`}
                      >
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{tool.name}</h3>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      {selectedTools.includes(tool.id) && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Model Parameters</h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.temperature || 0.7]}
                    onValueChange={([value]) => updateParameters('temperature', value)}
                    max={2}
                    min={0}
                    step={0.1}
                  />
                  <p className="text-sm text-muted-foreground">
                    Controls randomness in responses. Lower values are more focused and
                    deterministic.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.maxTokens || 2048]}
                    onValueChange={([value]) => updateParameters('maxTokens', value)}
                    max={4096}
                    min={256}
                    step={256}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Top P</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.topP}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.topP || 1.0]}
                    onValueChange={([value]) => updateParameters('topP', value)}
                    max={1}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={prevStep} disabled={currentStep === 1}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentStep < 5 ? (
              <Button onClick={nextStep} disabled={!formData.name || !formData.description}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Create Preset
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Render edit form with tabs
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Edit Preset</h2>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="model">Model & Parameters</TabsTrigger>
          <TabsTrigger value="prompt">System Prompt</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Preset Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateFormData('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'active' | 'draft') => updateFormData('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="model">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Model</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) => updateFormData('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-semibold">Parameters</h3>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Temperature</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.temperature || 0.7]}
                    onValueChange={([value]) => updateParameters('temperature', value)}
                    max={2}
                    min={0}
                    step={0.1}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Max Tokens</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.maxTokens || 2048]}
                    onValueChange={([value]) => updateParameters('maxTokens', value)}
                    max={4096}
                    min={256}
                    step={256}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Top P</Label>
                    <span className="text-sm text-muted-foreground">
                      {formData.parameters?.topP}
                    </span>
                  </div>
                  <Slider
                    value={[formData.parameters?.topP || 1.0]}
                    onValueChange={([value]) => updateParameters('topP', value)}
                    max={1}
                    min={0}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="prompt">
          <Card className="p-6">
            <div className="space-y-4">
              <Label>System Prompt</Label>
              <Textarea
                value={formData.systemPrompt}
                onChange={(e) => updateFormData('systemPrompt', e.target.value)}
                placeholder="You are a helpful assistant that..."
                className="min-h-[300px]"
              />
              <p className="text-sm text-muted-foreground">
                Define the agent's role, personality, and behavioral guidelines.
              </p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tools">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Available Tools</h3>
                <p className="text-sm text-muted-foreground">
                  Select tools that this agent can use to enhance its capabilities.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableTools.map((tool) => (
                  <Card
                    key={tool.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedTools.includes(tool.id) ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => toggleTool(tool.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedTools.includes(tool.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-100'
                        }`}
                      >
                        {tool.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{tool.name}</h4>
                        <p className="text-sm text-muted-foreground">{tool.description}</p>
                      </div>
                      {selectedTools.includes(tool.id) && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
