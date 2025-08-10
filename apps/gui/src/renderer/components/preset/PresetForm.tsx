import { McpToolDescription, Preset } from '@agentos/core';
import { ArrowLeft, ArrowRight, CheckCircle, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

interface DynamicFormRendererProps {
  preset: Preset | null;
  isCreateMode?: boolean;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  onSubmit?: (data: Partial<Preset>) => void | Promise<void>;
}

export function PrestForm({
  preset,
  isCreateMode = false,
  currentStep = 1,
  onStepChange,
  onComplete,
  onSubmit,
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Partial<Preset>>({ ...preset });

  const [selectedTools, setSelectedTools] = useState<McpToolDescription[]>(
    preset?.enabledMcps?.flatMap((mcp) => mcp.enabledTools) || []
  );

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateParameters = (field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      llmBridgeConfig: {
        ...(prev.llmBridgeConfig ?? {}),
        [field]: value,
      },
    }));
  };

  const toggleTool = (tool: McpToolDescription) => {
    const newTools = selectedTools.includes(tool)
      ? selectedTools.filter((t) => t.name !== tool.name)
      : [...selectedTools, tool];
    setSelectedTools(newTools);
    updateFormData('tools', newTools);
  };

  const handleSave = async () => {
    if (onSubmit) await onSubmit(formData);
    if (onComplete) onComplete();
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
                    value={formData.category?.[0] ?? ''}
                    onValueChange={(value) => updateFormData('category', [value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['research', 'development', 'creative', 'analytics'].map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
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
                    value={formData.llmBridgeConfig?.model ?? ''}
                    onValueChange={(value) => updateFormData('llmBridgeConfig.model', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'].map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
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
                {preset?.enabledMcps
                  ?.flatMap((mcp) => mcp.enabledTools)
                  .map((tool) => (
                    <Card
                      key={tool.name}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedTools.includes(tool) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => toggleTool(tool)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedTools.includes(tool)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100'
                          }`}
                        >
                          {tool.name}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium">{tool.name}</h3>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                        {selectedTools.includes(tool) && (
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
                      {formData.llmBridgeConfig?.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.temperature || 0.7]}
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
                      {formData.llmBridgeConfig?.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.maxTokens || 2048]}
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
                      {formData.llmBridgeConfig?.topP}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.topP || 1.0]}
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
                  value={formData.category?.[0] ?? ''}
                  onValueChange={(value) => updateFormData('category', [value])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['research', 'development', 'creative', 'analytics'].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
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
                  value={formData.llmBridgeConfig?.model ?? ''}
                  onValueChange={(value) => updateFormData('llmBridgeConfig.model', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet'].map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
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
                      {formData.llmBridgeConfig?.temperature}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.temperature || 0.7]}
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
                      {formData.llmBridgeConfig?.maxTokens}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.maxTokens || 2048]}
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
                      {formData.llmBridgeConfig?.topP}
                    </span>
                  </div>
                  <Slider
                    value={[formData.llmBridgeConfig?.topP || 1.0]}
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
                {preset?.enabledMcps
                  ?.flatMap((mcp) => mcp.enabledTools)
                  .map((tool) => (
                    <Card
                      key={tool.name}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedTools.includes(tool) ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => toggleTool(tool)}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            selectedTools.includes(tool)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-gray-100'
                          }`}
                        >
                          {tool.name}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-muted-foreground">{tool.description}</p>
                        </div>
                        {selectedTools.includes(tool) && (
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
