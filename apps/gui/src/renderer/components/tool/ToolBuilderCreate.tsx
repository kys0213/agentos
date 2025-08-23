import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Code,
  Copy,
  Eye,
  Globe,
  Loader2,
  Play,
  Settings,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';

interface ToolBuilderCreateProps {
  onBack: () => void;
  onCreate: (tool: {
    name: string;
    description: string;
    category: string;
    code: string;
    config: unknown;
  }) => void;
}

type Step = 'describe' | 'analyze' | 'generate' | 'test' | 'deploy';

export function ToolBuilderCreate({ onBack, onCreate }: ToolBuilderCreateProps) {
  const [currentStep, setCurrentStep] = useState<Step>('describe');
  const [isProcessing, setIsProcessing] = useState(false);
  // progress is computed from step; no separate state to avoid unused warnings

  // Form data
  const [description, setDescription] = useState('');
  const [apiInfo, setApiInfo] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Generated data
  type AnalysisParam = { name: string; type: string; required: boolean; description: string };
  type Analysis = {
    detectedType: string;
    endpoint: string;
    method: string;
    authType: string;
    parameters: AnalysisParam[];
    responseFormat: string;
    rateLimits: string;
  };
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [generatedCode, setGeneratedCode] = useState('');
  type ToolConfig = {
    name: string;
    description: string;
    category: string;
    apiEndpoint: string;
    method: string;
  };
  const [toolConfig, setToolConfig] = useState<ToolConfig | null>(null);
  type TestResults = {
    status: 'success' | 'error';
    message: string;
    responseTime: string;
    testData: Record<string, unknown>;
  };
  const [testResults, setTestResults] = useState<TestResults | null>(null);

  const steps = [
    { id: 'describe', label: 'Describe', icon: Sparkles },
    { id: 'analyze', label: 'Analyze', icon: Eye },
    { id: 'generate', label: 'Generate', icon: Code },
    { id: 'test', label: 'Test', icon: Play },
    { id: 'deploy', label: 'Deploy', icon: CheckCircle },
  ];

  const stepCircleClass = (isCompleted: boolean, isActive: boolean) => {
    if (isCompleted) {
      return 'bg-primary text-primary-foreground';
    }
    if (isActive) {
      return 'bg-primary/10 text-primary border-2 border-primary';
    }
    return 'bg-muted text-muted-foreground';
  };

  const popularTemplates = [
    {
      id: 'slack',
      name: 'Slack Integration',
      description: 'Send messages to Slack channels',
      example: "Send a message to #general channel saying 'Hello World'",
    },
    {
      id: 'weather',
      name: 'Weather API',
      description: 'Get weather information',
      example: 'Get current weather for New York City',
    },
    {
      id: 'github',
      name: 'GitHub Actions',
      description: 'Interact with GitHub repositories',
      example: 'Create an issue in my repository with title and description',
    },
    {
      id: 'email',
      name: 'Email Sender',
      description: 'Send emails via SMTP or API',
      example: 'Send an email to user@example.com with subject and body',
    },
  ];

  const mockAnalysis = {
    detectedType: 'REST API',
    endpoint: 'https://api.slack.com/chat.postMessage',
    method: 'POST',
    authType: 'Bearer Token',
    parameters: [
      { name: 'channel', type: 'string', required: true, description: 'Channel ID or name' },
      { name: 'text', type: 'string', required: true, description: 'Message text' },
      { name: 'username', type: 'string', required: false, description: 'Bot username' },
    ],
    responseFormat: 'JSON',
    rateLimits: '1000 requests per minute',
  };

  const mockGeneratedCode = `// Slack Message Tool
export const slackMessenger = {
  name: "slack_messenger",
  description: "Send messages to Slack channels and users",
  parameters: {
    type: "object",
    properties: {
      channel: {
        type: "string",
        description: "Channel ID or name (e.g., #general, @username)"
      },
      text: {
        type: "string",
        description: "Message content to send"
      },
      username: {
        type: "string",
        description: "Display name for the bot (optional)"
      }
    },
    required: ["channel", "text"]
  },

  async execute({ channel, text, username }) {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${process.env.SLACK_BOT_TOKEN}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channel,
        text,
        username: username || 'AgentOS Bot'
      })
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(\`Slack API error: \${result.error}\`);
    }

    return {
      success: true,
      message: "Message sent successfully",
      timestamp: result.ts,
      channel: result.channel
    };
  }
};`;

  const handleNext = async () => {
    setIsProcessing(true);

    // Simulate AI processing
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    switch (currentStep) {
      case 'describe':
        // step progress updated implicitly by UI
        await delay(1500);
        setAnalysis(mockAnalysis);
        setCurrentStep('analyze');
        break;

      case 'analyze':
        // step progress updated implicitly by UI
        await delay(2000);
        setGeneratedCode(mockGeneratedCode);
        setToolConfig({
          name: 'Slack Messenger',
          description: 'Send messages to Slack channels and users',
          category: 'communication',
          apiEndpoint: 'https://slack.com/api/chat.postMessage',
          method: 'POST',
        });
        setCurrentStep('generate');
        break;

      case 'generate':
        // step progress updated implicitly by UI
        await delay(1500);
        setTestResults({
          status: 'success',
          message: 'Tool executed successfully',
          responseTime: '245ms',
          testData: {
            channel: '#test-channel',
            text: 'Hello from AgentOS Tool Builder!',
            success: true,
          },
        });
        setCurrentStep('test');
        break;

      case 'test':
        // step progress updated implicitly by UI
        await delay(1000);
        setCurrentStep('deploy');
        break;

      case 'deploy':
        // step progress updated implicitly by UI
        await delay(1500);
        onCreate({
          name: toolConfig.name,
          description: toolConfig.description,
          category: toolConfig.category,
          code: generatedCode,
          config: toolConfig,
        });
        break;
    }

    setIsProcessing(false);
  };

  const handleTemplateSelect = (template: { id: string; example: string }) => {
    setSelectedTemplate(template.id);
    setDescription(template.example);
  };

  const getStepIndex = () => steps.findIndex((step) => step.id === currentStep);

  const primaryButtonLabel = (step: Step): string => {
    if (step === 'describe') {
      return 'Analyze Request';
    }
    if (step === 'analyze') {
      return 'Generate Code';
    }
    if (step === 'generate') {
      return 'Run Tests';
    }
    return 'Deploy Tool';
  };

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="w-px h-6 bg-border"></div>
            <div>
              <h1 className="text-lg font-semibold">Create Custom Tool</h1>
              <p className="text-sm text-muted-foreground">
                Step {getStepIndex() + 1} of {steps.length}: {steps[getStepIndex()].label}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Progress value={((getStepIndex() + 1) / steps.length) * 100} className="w-32" />
            <Badge variant="outline" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI Powered
            </Badge>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mt-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = getStepIndex() > index;

            return (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${stepCircleClass(
                    isCompleted,
                    isActive
                  )}`}
                >
                  {isCompleted ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-sm ${
                    isActive ? 'text-foreground font-medium' : 'text-muted-foreground'
                  }`}
                >
                  {step.label}
                </span>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-px ${isCompleted ? 'bg-primary' : 'bg-border'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {currentStep === 'describe' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Describe Your Tool</h2>
              <p className="text-muted-foreground">
                Tell us what you want your tool to do. Our AI will analyze your request and generate
                the perfect tool for you.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="gap-2 flex items-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                  What do you want to build?
                </CardTitle>
                <CardDescription>
                  Describe your tool in natural language. Be as specific as possible about what it
                  should do.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Tool Description</Label>
                  <Textarea
                    placeholder="e.g., Send messages to Slack channels, Get weather information for any city, Create GitHub issues..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Additional Information (Optional)</Label>
                  <Textarea
                    placeholder="Paste API documentation, curl commands, or any technical details..."
                    value={apiInfo}
                    onChange={(e) => setApiInfo(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Popular Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Templates</CardTitle>
                <CardDescription>
                  Get started faster with these common tool patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {popularTemplates.map((template) => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handleTemplateSelect(template)}
                    >
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                      <p className="text-xs text-primary mt-1">{template.example}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'analyze' && analysis && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Analysis Complete</h2>
              <p className="text-muted-foreground">
                Our AI has analyzed your request and detected the following API structure
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="gap-2 flex items-center">
                    <Globe className="w-5 h-5" />
                    API Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <Badge>{analysis.detectedType}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Method:</span>
                    <Badge variant="outline">{analysis.method}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Auth:</span>
                    <Badge variant="outline">{analysis.authType}</Badge>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-sm">Endpoint:</span>
                    <code className="text-xs bg-muted p-2 rounded block break-all">
                      {analysis.endpoint}
                    </code>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="gap-2 flex items-center">
                    <Settings className="w-5 h-5" />
                    Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.parameters.map((param: AnalysisParam, index: number) => (
                      <div
                        key={index}
                        className="flex items-start justify-between p-3 bg-muted/50 rounded"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm font-mono">{param.name}</code>
                            <Badge
                              variant={param.required ? 'default' : 'outline'}
                              className="text-xs"
                            >
                              {param.required ? 'Required' : 'Optional'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{param.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {param.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {currentStep === 'generate' && generatedCode && (
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Code Generated</h2>
              <p className="text-muted-foreground">
                Your custom tool has been generated! Review the code and configuration below.
              </p>
            </div>

            <Tabs defaultValue="code" className="w-full">
              <TabsList>
                <TabsTrigger value="code">Generated Code</TabsTrigger>
                <TabsTrigger value="config">Configuration</TabsTrigger>
                <TabsTrigger value="docs">Documentation</TabsTrigger>
              </TabsList>

              <TabsContent value="code" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="gap-2 flex items-center">
                        <Code className="w-5 h-5" />
                        Tool Implementation
                      </CardTitle>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Copy className="w-4 h-4" />
                        Copy Code
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{generatedCode}</code>
                    </pre>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="config" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="gap-2 flex items-center">
                      <Settings className="w-5 h-5" />
                      Tool Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Tool Name</Label>
                        <Input value={toolConfig?.name || ''} readOnly />
                      </div>
                      <div>
                        <Label>Category</Label>
                        <Input value={toolConfig?.category || ''} readOnly />
                      </div>
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea value={toolConfig?.description || ''} readOnly rows={2} />
                    </div>
                    <div>
                      <Label>API Endpoint</Label>
                      <Input value={toolConfig?.apiEndpoint || ''} readOnly />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="docs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Usage Documentation</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <h4>How to use this tool:</h4>
                    <ol>
                      <li>Ensure you have the required API credentials configured</li>
                      <li>Call the tool with the required parameters</li>
                      <li>Handle the response according to your needs</li>
                    </ol>

                    <h4>Example usage:</h4>
                    <code className="block bg-muted p-2 rounded text-xs">
                      await slackMessenger.execute({'{'}
                      <br />
                      &nbsp;&nbsp;channel: "#general",
                      <br />
                      &nbsp;&nbsp;text: "Hello from AgentOS!"
                      <br />
                      {'}'})
                    </code>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {currentStep === 'test' && testResults && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold">Test Results</h2>
              <p className="text-muted-foreground">
                Your tool has been tested successfully! Review the results below.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="gap-2 flex items-center">
                  {testResults.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-status-active" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-status-error" />
                  )}
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-status-active-background rounded">
                  <span>Status</span>
                  <Badge className="status-active-subtle">Success</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
                  <span>Response Time</span>
                  <span className="font-mono text-sm">{testResults.responseTime}</span>
                </div>

                <div className="space-y-2">
                  <Label>Test Data</Label>
                  <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                    {JSON.stringify(testResults.testData, null, 2)}
                  </pre>
                </div>

                <div className="p-3 bg-status-active-background rounded">
                  <p className="text-sm text-status-active font-medium">
                    ✓ Tool executed successfully and returned expected results
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {currentStep === 'deploy' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center space-y-2">
              <CheckCircle className="w-16 h-16 text-status-active mx-auto" />
              <h2 className="text-2xl font-semibold">Tool Deployed Successfully!</h2>
              <p className="text-muted-foreground">
                Your custom tool is now available and ready to use by your AI agents.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>{toolConfig?.name}</CardTitle>
                <CardDescription>{toolConfig?.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <Badge className="status-active-subtle">Active</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span>Category</span>
                  <Badge variant="outline">{toolConfig?.category}</Badge>
                </div>

                <div className="p-3 bg-primary/5 rounded border border-primary/20">
                  <p className="text-sm">
                    <strong>Next steps:</strong> Your tool is now available in the Tool Builder
                    section. You can start using it in your conversations by mentioning it to your
                    AI agents.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t bg-card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {currentStep === 'deploy'
              ? 'Tool created successfully!'
              : 'AI is analyzing your request...'}
          </div>

          <div className="flex items-center gap-3">
            {currentStep !== 'deploy' && (
              <Button
                onClick={handleNext}
                disabled={isProcessing || !description.trim()}
                className="gap-2"
              >
                {!isProcessing && <Sparkles className="w-4 h-4" />}
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                {primaryButtonLabel(currentStep)}
              </Button>
            )}

            {currentStep === 'deploy' && (
              <Button onClick={onBack} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Done
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
