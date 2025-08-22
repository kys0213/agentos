import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Bug,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  Globe,
  Info,
  Key,
  Loader2,
  Network,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Shield,
  Terminal,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import type {
  McpConfig,
  SseMcpConfig,
  StdioMcpConfig,
  StreamableHttpMcpConfig,
  WebSocketMcpConfig,
} from '@agentos/core';

interface MCPToolCreateProps {
  onBack: () => void;
  onCreate: (mcpConfig: McpConfig) => void;
}

interface ConnectionTest {
  step: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
  suggestion?: string;
}

interface TroubleshootingGuide {
  issue: string;
  description: string;
  solutions: string[];
  isCommon: boolean;
}

export function MCPToolCreate({ onBack, onCreate }: MCPToolCreateProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Form state
  const [formData, setFormData] = useState({
    type: 'stdio' as 'stdio' | 'streamableHttp' | 'websocket' | 'sse',
    name: '',
    description: '',
    version: '1.0.0',
    category: 'general',
    command: '',
    args: [] as string[],
    url: '',
    cwd: '',
    network: {
      timeoutMs: 5000,
      maxTotalTimeoutMs: 30000,
      maxConnectionIdleTimeoutMs: 60000,
    },
  });

  // Environment variables and headers
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);

  // Connection testing
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTests, setConnectionTests] = useState<ConnectionTest[]>([]);
  const [finalTestResult, setFinalTestResult] = useState<'success' | 'error' | null>(null);

  // Derived flags/labels to simplify JSX (avoid nested/long ternaries)
  const isWebsocket = formData.type === 'websocket';
  const isSse = formData.type === 'sse';
  const isStreamHttp = formData.type === 'streamableHttp';
  const isHttpLike = isStreamHttp || isSse;
  let connTitle = 'Server-Sent Events';
  if (isStreamHttp) {
    connTitle = 'HTTP Streaming';
  } else if (isWebsocket) {
    connTitle = 'WebSocket';
  }
  let urlPlaceholder = 'http://localhost:8080/mcp';
  if (isWebsocket) {
    urlPlaceholder = 'ws://localhost:8080/mcp';
  } else if (isSse) {
    urlPlaceholder = 'http://localhost:8080/events';
  }
  const ConnIcon = isWebsocket ? Wifi : Globe;

  const badgeVariant = (s: ConnectionTest['status']) => {
    switch (s) {
      case 'success':
        return 'default' as const;
      case 'error':
        return 'destructive' as const;
      case 'running':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  };

  const connectionTypes = [
    {
      type: 'stdio' as const,
      name: 'Standard I/O',
      description: 'Local process communication via stdin/stdout',
      icon: <Terminal className="w-6 h-6" />,
      recommended: true,
      complexity: 'Simple',
      useCase: 'Local tools and scripts',
    },
    {
      type: 'streamableHttp' as const,
      name: 'HTTP Streaming',
      description: 'HTTP-based streaming connection',
      icon: <Globe className="w-6 h-6" />,
      recommended: false,
      complexity: 'Medium',
      useCase: 'Web APIs and services',
    },
    {
      type: 'websocket' as const,
      name: 'WebSocket',
      description: 'Real-time bidirectional communication',
      icon: <Wifi className="w-6 h-6" />,
      recommended: false,
      complexity: 'Medium',
      useCase: 'Real-time applications',
    },
    {
      type: 'sse' as const,
      name: 'Server-Sent Events',
      description: 'Server-sent events (deprecated)',
      icon: <Zap className="w-6 h-6" />,
      deprecated: true,
      complexity: 'Legacy',
      useCase: 'Legacy systems only',
    },
  ];

  const troubleshootingGuides: TroubleshootingGuide[] = [
    {
      issue: 'Command not found',
      description: 'The specified command or executable cannot be found in the system PATH',
      solutions: [
        'Verify the command exists and is executable',
        'Use absolute path to the executable',
        'Check if required dependencies are installed',
        'Ensure the working directory is correct',
      ],
      isCommon: true,
    },
    {
      issue: 'Permission denied',
      description: 'Insufficient permissions to execute the command or access resources',
      solutions: [
        'Check file permissions (chmod +x)',
        'Run with appropriate user privileges',
        'Verify directory access permissions',
        'Check if SELinux/AppArmor is blocking execution',
      ],
      isCommon: true,
    },
    {
      issue: 'Connection timeout',
      description: 'Unable to establish connection within the specified timeout period',
      solutions: [
        'Increase timeout values in network settings',
        'Check network connectivity and firewall rules',
        'Verify the target service is running',
        'Test connection manually with curl or telnet',
      ],
      isCommon: true,
    },
    {
      issue: 'Invalid URL or endpoint',
      description: 'The specified URL is malformed or the endpoint is not accessible',
      solutions: [
        'Verify URL format and protocol (http/https/ws/wss)',
        'Check if the service is running on the specified port',
        'Test the endpoint with a browser or API client',
        'Ensure DNS resolution is working',
      ],
      isCommon: true,
    },
    {
      issue: 'Authentication failed',
      description: 'API key, token, or credentials are invalid or expired',
      solutions: [
        'Verify API key or token is correct and active',
        'Check authentication headers format',
        "Ensure credentials haven't expired",
        'Test authentication separately',
      ],
      isCommon: false,
    },
    {
      issue: 'Protocol mismatch',
      description: 'The MCP protocol version or format is incompatible',
      solutions: [
        'Check MCP protocol version compatibility',
        'Verify message format and structure',
        'Update to latest MCP specification',
        'Check for protocol-specific requirements',
      ],
      isCommon: false,
    },
  ];

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const addEnvVar = () => {
    setEnvVars((prev) => [...prev, { key: '', value: '' }]);
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    setEnvVars((prev) => prev.map((env, i) => (i === index ? { ...env, [field]: value } : env)));
  };

  const removeEnvVar = (index: number) => {
    setEnvVars((prev) => prev.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    setHeaders((prev) => [...prev, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setHeaders((prev) =>
      prev.map((header, i) => (i === index ? { ...header, [field]: value } : header))
    );
  };

  const removeHeader = (index: number) => {
    setHeaders((prev) => prev.filter((_, i) => i !== index));
  };

  const runConnectionTest = async () => {
    setIsTestingConnection(true);
    setFinalTestResult(null);

    const tests: ConnectionTest[] = [
      { step: 'Validating configuration', status: 'pending', message: 'Checking form data...' },
      {
        step: 'Testing network connectivity',
        status: 'pending',
        message: 'Checking network access...',
      },
      {
        step: 'Verifying permissions',
        status: 'pending',
        message: 'Checking access permissions...',
      },
      { step: 'Testing MCP protocol', status: 'pending', message: 'Validating MCP compliance...' },
      { step: 'Final validation', status: 'pending', message: 'Running final checks...' },
    ];

    setConnectionTests(tests);

    // Simulate step-by-step testing
    for (let i = 0; i < tests.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000));

      const updatedTests = [...tests];
      updatedTests[i].status = 'running';
      setConnectionTests([...updatedTests]);

      await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1500));

      // Simulate different outcomes
      const shouldFail = Math.random() < 0.2; // 20% chance of failure

      if (shouldFail && i === 1) {
        // Network connectivity failure
        updatedTests[i] = {
          ...updatedTests[i],
          status: 'error',
          message: 'Connection timeout',
          details: 'Unable to connect to the specified endpoint within 5 seconds',
          suggestion: 'Check network connectivity and increase timeout values',
        };
        setConnectionTests([...updatedTests]);
        setFinalTestResult('error');
        setIsTestingConnection(false);
        return;
      } else if (shouldFail && i === 2) {
        // Permission failure
        updatedTests[i] = {
          ...updatedTests[i],
          status: 'error',
          message: 'Permission denied',
          details:
            formData.type === 'stdio'
              ? 'Command is not executable or path not found'
              : 'API authentication failed',
          suggestion:
            formData.type === 'stdio'
              ? 'Check file permissions and PATH'
              : 'Verify API key and authentication headers',
        };
        setConnectionTests([...updatedTests]);
        setFinalTestResult('error');
        setIsTestingConnection(false);
        return;
      } else {
        // Success
        const successMessages = [
          'Configuration is valid',
          'Network connectivity established',
          'Permissions verified',
          'MCP protocol compliance confirmed',
          'All checks passed successfully',
        ];

        updatedTests[i] = {
          ...updatedTests[i],
          status: 'success',
          message: successMessages[i],
          details: i === tests.length - 1 ? 'MCP tool is ready for deployment' : undefined,
        };
      }

      setConnectionTests([...updatedTests]);
    }

    setFinalTestResult('success');
    setIsTestingConnection(false);
  };

  const handleCreate = () => {
    if (!isFormValid()) {
      return;
    }

    let finalConfig: McpConfig;

    const envObj = envVars.reduce(
      (acc, env) => {
        if (env.key && env.value) {
          acc[env.key] = env.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    const headersObj = headers.reduce(
      (acc, header) => {
        if (header.key && header.value) {
          acc[header.key] = header.value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    switch (formData.type) {
      case 'stdio':
        finalConfig = {
          type: 'stdio',
          name: formData.name,
          version: formData.version,
          command: formData.command,
          args: formData.args.filter(Boolean),
          env: Object.keys(envObj).length > 0 ? envObj : undefined,
          cwd: formData.cwd || undefined,
          network: formData.network,
        } as StdioMcpConfig;
        break;
      case 'streamableHttp':
        finalConfig = {
          type: 'streamableHttp',
          name: formData.name,
          version: formData.version,
          url: formData.url,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
          network: formData.network,
        } as StreamableHttpMcpConfig;
        break;
      case 'websocket':
        finalConfig = {
          type: 'websocket',
          name: formData.name,
          version: formData.version,
          url: formData.url,
          network: formData.network,
        } as WebSocketMcpConfig;
        break;
      case 'sse':
        finalConfig = {
          type: 'sse',
          name: formData.name,
          version: formData.version,
          url: formData.url,
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined,
          network: formData.network,
        } as SseMcpConfig;
        break;
    }

    onCreate(finalConfig);
  };

  const isFormValid = () => {
    if (!formData.name || !formData.version) {
      return false;
    }

    switch (formData.type) {
      case 'stdio':
        return !!formData.command;
      case 'streamableHttp':
      case 'websocket':
      case 'sse':
        return !!formData.url;
      default:
        return false;
    }
  };

  const getStepFromTab = (tab: string) => {
    switch (tab) {
      case 'overview':
        return 1;
      case 'type':
        return 2;
      case 'configuration':
        return 3;
      case 'testing':
        return 4;
      case 'deployment':
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
        return 'type';
      case 3:
        return 'configuration';
      case 4:
        return 'testing';
      case 5:
        return 'deployment';
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
              Back to Tools
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-indigo-100 rounded-lg flex items-center justify-center">
                <div className="text-purple-600">
                  <Settings className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Add MCP Tool</h1>
                <p className="text-muted-foreground">
                  Configure and deploy a Model Context Protocol tool
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleCreate} disabled={!isFormValid()} className="gap-2">
              <Save className="w-4 h-4" />
              Deploy Tool
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
            <span className={currentStep >= 2 ? 'text-foreground font-medium' : ''}>
              Connection Type
            </span>
            <span className={currentStep >= 3 ? 'text-foreground font-medium' : ''}>
              Configuration
            </span>
            <span className={currentStep >= 4 ? 'text-foreground font-medium' : ''}>Testing</span>
            <span className={currentStep >= 5 ? 'text-foreground font-medium' : ''}>
              Deployment
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full flex flex-col">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="type">Connection Type</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="testing">Testing</TabsTrigger>
            <TabsTrigger value="deployment">Deployment</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="overview" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-foreground">What is an MCP Tool?</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Model Context Protocol (MCP) tools provide a standardized way to extend AI
                    agents with external capabilities. These tools can access databases, APIs, local
                    files, or execute code to help agents perform complex tasks.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Benefits:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Standardized integration protocol
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Secure and sandboxed execution
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Real-time capability extension
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Cross-platform compatibility
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Use Cases:</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Database queries and operations</li>
                        <li>• API integrations and web services</li>
                        <li>• File system operations</li>
                        <li>• Code execution and validation</li>
                        <li>• Real-time data streaming</li>
                        <li>• Custom business logic</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tool-name">Tool Name *</Label>
                        <Input
                          id="tool-name"
                          value={formData.name}
                          onChange={(e) => updateFormData({ name: e.target.value })}
                          placeholder="e.g., github-integration"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tool-description">Description</Label>
                        <Textarea
                          id="tool-description"
                          value={formData.description}
                          onChange={(e) => updateFormData({ description: e.target.value })}
                          placeholder="Brief description of what this tool does"
                          className="mt-1"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tool-version">Version</Label>
                        <Input
                          id="tool-version"
                          value={formData.version}
                          onChange={(e) => updateFormData({ version: e.target.value })}
                          placeholder="1.0.0"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tool-category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => updateFormData({ category: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="general">General</SelectItem>
                            <SelectItem value="development">Development</SelectItem>
                            <SelectItem value="data">Data & Analytics</SelectItem>
                            <SelectItem value="api">API Integration</SelectItem>
                            <SelectItem value="productivity">Productivity</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <div></div>
                  <Button onClick={handleNextStep} className="gap-2">
                    Next: Choose Connection Type
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="type" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Choose Connection Type
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    Select how your MCP tool will communicate with the system. Each type has
                    different use cases and requirements.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {connectionTypes.map((type) => (
                      <Card
                        key={type.type}
                        className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                          formData.type === type.type ? 'ring-2 ring-primary bg-primary/5' : ''
                        } ${type.deprecated ? 'opacity-60' : ''}`}
                        onClick={() => !type.deprecated && updateFormData({ type: type.type })}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {type.icon}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">{type.name}</h4>
                              {type.recommended && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  Recommended
                                </Badge>
                              )}
                              {type.deprecated && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                >
                                  Deprecated
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{type.description}</p>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Complexity:</span>
                                <span className="font-medium">{type.complexity}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Best for:</span>
                                <span className="font-medium">{type.useCase}</span>
                              </div>
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
                    Next: Configuration
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Connection-specific Configuration */}
                {formData.type === 'stdio' && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Terminal className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-foreground">
                        Standard I/O Configuration
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="stdio-command">Command *</Label>
                        <Input
                          id="stdio-command"
                          value={formData.command}
                          onChange={(e) => updateFormData({ command: e.target.value })}
                          placeholder="node /path/to/mcp-server.js"
                          className="mt-1 font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Full path to the executable or command to run
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="stdio-args">Arguments (one per line)</Label>
                        <Textarea
                          id="stdio-args"
                          value={formData.args.join('\n')}
                          onChange={(e) =>
                            updateFormData({
                              args: e.target.value
                                ? e.target.value.split('\n').filter(Boolean)
                                : [],
                            })
                          }
                          placeholder="--config=/path/to/config.json&#10;--verbose&#10;--port=8080"
                          className="mt-1 font-mono"
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="stdio-cwd">Working Directory</Label>
                        <Input
                          id="stdio-cwd"
                          value={formData.cwd}
                          onChange={(e) => updateFormData({ cwd: e.target.value })}
                          placeholder="/path/to/working/directory"
                          className="mt-1 font-mono"
                        />
                      </div>

                      {/* Environment Variables */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <Label>Environment Variables</Label>
                          <Button variant="outline" size="sm" onClick={addEnvVar} className="gap-1">
                            <Plus className="w-3 h-3" />
                            Add Variable
                          </Button>
                        </div>
                        {envVars.length === 0 && (
                          <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                            <Key className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                              No environment variables set
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addEnvVar}
                              className="mt-3 gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add First Variable
                            </Button>
                          </div>
                        )}
                        {envVars.length > 0 && (
                          <div className="space-y-3">
                            {envVars.map((env, index) => (
                              <div key={index} className="flex gap-2">
                                <Input
                                  placeholder="Variable name"
                                  value={env.key}
                                  onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                                  className="flex-1 font-mono"
                                />
                                <Input
                                  placeholder="Value"
                                  value={env.value}
                                  onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                                  className="flex-1 font-mono"
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeEnvVar(index)}
                                  className="px-2"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                )}

                {(isHttpLike || isWebsocket) && (
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <ConnIcon className="w-5 h-5 text-blue-500" />
                      <h3 className="text-lg font-semibold text-foreground">
                        {connTitle} Configuration
                      </h3>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="url">URL *</Label>
                        <Input
                          id="url"
                          value={formData.url}
                          onChange={(e) => updateFormData({ url: e.target.value })}
                          placeholder={urlPlaceholder}
                          className="mt-1 font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Complete URL including protocol and port
                        </p>
                      </div>

                      {isHttpLike && (
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <Label>Headers</Label>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={addHeader}
                              className="gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              Add Header
                            </Button>
                          </div>
                          {headers.length === 0 && (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                              <FileText className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                              <p className="text-sm text-muted-foreground">No custom headers set</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={addHeader}
                                className="mt-3 gap-1"
                              >
                                <Plus className="w-3 h-3" />
                                Add First Header
                              </Button>
                            </div>
                          )}
                          {headers.length > 0 && (
                            <div className="space-y-3">
                              {headers.map((header, index) => (
                                <div key={index} className="flex gap-2">
                                  <Input
                                    placeholder="Header name (e.g., Authorization)"
                                    value={header.key}
                                    onChange={(e) => updateHeader(index, 'key', e.target.value)}
                                    className="flex-1 font-mono"
                                  />
                                  <Input
                                    placeholder="Value"
                                    value={header.value}
                                    onChange={(e) => updateHeader(index, 'value', e.target.value)}
                                    className="flex-1 font-mono"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => removeHeader(index)}
                                    className="px-2"
                                  >
                                    <X className="w-3 h-3" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* Network Configuration */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Network className="w-5 h-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-foreground">Network Settings</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="timeout">Connection Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={formData.network.timeoutMs}
                        onChange={(e) =>
                          updateFormData({
                            network: {
                              ...formData.network,
                              timeoutMs: parseInt(e.target.value) || 5000,
                            },
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Initial connection timeout
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="max-timeout">Max Total Timeout (ms)</Label>
                      <Input
                        id="max-timeout"
                        type="number"
                        value={formData.network.maxTotalTimeoutMs}
                        onChange={(e) =>
                          updateFormData({
                            network: {
                              ...formData.network,
                              maxTotalTimeoutMs: parseInt(e.target.value) || 30000,
                            },
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Maximum operation timeout
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="idle-timeout">Idle Timeout (ms)</Label>
                      <Input
                        id="idle-timeout"
                        type="number"
                        value={formData.network.maxConnectionIdleTimeoutMs}
                        onChange={(e) =>
                          updateFormData({
                            network: {
                              ...formData.network,
                              maxConnectionIdleTimeoutMs: parseInt(e.target.value) || 60000,
                            },
                          })
                        }
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Connection idle timeout</p>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Connection Type
                  </Button>
                  <Button onClick={handleNextStep} disabled={!isFormValid()} className="gap-2">
                    Next: Testing
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="testing" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Connection Testing</h3>
                      <p className="text-muted-foreground">
                        Verify your MCP tool configuration and test connectivity before deployment.
                      </p>
                    </div>
                    <Button
                      onClick={runConnectionTest}
                      disabled={isTestingConnection || !isFormValid()}
                      className="gap-2"
                    >
                      {isTestingConnection && <Loader2 className="w-4 h-4 animate-spin" />}
                      {!isTestingConnection && <RefreshCw className="w-4 h-4" />}
                      {isTestingConnection ? 'Testing...' : 'Run Test'}
                    </Button>
                  </div>

                  {/* Configuration Summary */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-medium text-foreground mb-3">Configuration Summary</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Name:</span>
                          <span className="font-medium font-mono">
                            {formData.name || 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="font-medium capitalize">{formData.type}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Version:</span>
                          <span className="font-medium">{formData.version}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            {formData.type === 'stdio' ? 'Command:' : 'URL:'}
                          </span>
                          <span className="font-medium font-mono text-xs truncate">
                            {formData.type === 'stdio'
                              ? formData.command || 'Not set'
                              : formData.url || 'Not set'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Timeout:</span>
                          <span className="font-medium">{formData.network.timeoutMs}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Category:</span>
                          <span className="font-medium capitalize">{formData.category}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Test Results */}
                  {connectionTests.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-foreground">Test Results</h4>
                      {connectionTests.map((test, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className="flex-shrink-0 mt-0.5">
                            {test.status === 'pending' && (
                              <Clock className="w-4 h-4 text-gray-400" />
                            )}
                            {test.status === 'running' && (
                              <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                            )}
                            {test.status === 'success' && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {test.status === 'error' && (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-medium text-foreground">{test.step}</h5>
                              <Badge variant={badgeVariant(test.status)} className="text-xs">
                                {test.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{test.message}</p>
                            {test.details && (
                              <p className="text-xs text-muted-foreground mt-1 font-mono bg-gray-50 p-2 rounded">
                                {test.details}
                              </p>
                            )}
                            {test.suggestion && (
                              <Alert className="mt-2">
                                <Info className="w-4 h-4" />
                                <AlertDescription className="text-xs">
                                  <strong>Suggestion:</strong> {test.suggestion}
                                </AlertDescription>
                              </Alert>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Final Result */}
                  {finalTestResult && (
                    <Alert
                      className={
                        finalTestResult === 'success'
                          ? 'border-green-200 bg-green-50'
                          : 'border-red-200 bg-red-50'
                      }
                    >
                      {finalTestResult === 'success' && (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                      {finalTestResult === 'error' && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <AlertDescription
                        className={
                          finalTestResult === 'success' ? 'text-green-800' : 'text-red-800'
                        }
                      >
                        {finalTestResult === 'success'
                          ? 'All tests passed! Your MCP tool is ready for deployment.'
                          : 'Tests failed. Please review the errors above and adjust your configuration.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>

                {/* Troubleshooting Guide */}
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bug className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold text-foreground">Troubleshooting Guide</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Common issues and their solutions when setting up MCP tools.
                  </p>

                  <div className="space-y-3">
                    {troubleshootingGuides.map((guide, index) => (
                      <Collapsible key={index}>
                        <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left hover:bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {guide.isCommon && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                              >
                                Common
                              </Badge>
                            )}
                            <span className="font-medium text-foreground">{guide.issue}</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                          <p className="text-sm text-muted-foreground mb-3">{guide.description}</p>
                          <div className="space-y-2">
                            <h5 className="text-sm font-medium text-foreground">Solutions:</h5>
                            <ul className="space-y-1">
                              {guide.solutions.map((solution, sIndex) => (
                                <li
                                  key={sIndex}
                                  className="text-sm text-muted-foreground flex items-start gap-2"
                                >
                                  <span className="text-blue-500 mt-1">•</span>
                                  <span>{solution}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Configuration
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={finalTestResult !== 'success'}
                    className="gap-2"
                  >
                    Next: Deployment
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="deployment" className="h-full">
              <div className="max-w-4xl mx-auto space-y-6">
                <Card className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-foreground">Ready for Deployment</h3>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Your MCP tool has been successfully configured and tested. Review the final
                    configuration before deployment.
                  </p>

                  {/* Final Configuration */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-foreground">Final Configuration</h4>
                      <Button variant="outline" size="sm" className="gap-1">
                        <Copy className="w-3 h-3" />
                        Copy Config
                      </Button>
                    </div>
                    <pre className="text-xs font-mono text-foreground bg-white p-3 rounded border overflow-x-auto">
                      {JSON.stringify(
                        {
                          type: formData.type,
                          name: formData.name,
                          version: formData.version,
                          ...(formData.type === 'stdio' && {
                            command: formData.command,
                            args: formData.args.filter(Boolean),
                            ...(envVars.length > 0 && {
                              env: envVars.reduce(
                                (acc, env) => {
                                  if (env.key && env.value) {
                                    acc[env.key] = env.value;
                                  }
                                  return acc;
                                },
                                {} as Record<string, string>
                              ),
                            }),
                            ...(formData.cwd && { cwd: formData.cwd }),
                          }),
                          ...(formData.type !== 'stdio' && { url: formData.url }),
                          ...(headers.length > 0 && {
                            headers: headers.reduce(
                              (acc, header) => {
                                if (header.key && header.value) {
                                  acc[header.key] = header.value;
                                }
                                return acc;
                              },
                              {} as Record<string, string>
                            ),
                          }),
                          network: formData.network,
                        },
                        null,
                        2
                      )}
                    </pre>
                  </div>

                  {/* Security Checklist */}
                  <Alert className="mb-6">
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Security Note:</strong> Ensure that your MCP tool follows security
                      best practices, including input validation, secure credential storage, and
                      proper error handling.
                    </AlertDescription>
                  </Alert>

                  {/* Next Steps */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-foreground">Next Steps:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-foreground mb-2">After Deployment</h5>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• Monitor tool performance and logs</li>
                          <li>• Test with different agents and scenarios</li>
                          <li>• Configure permissions for specific agents</li>
                          <li>• Set up usage monitoring and alerts</li>
                        </ul>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <h5 className="font-medium text-foreground mb-2">Management</h5>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          <li>• View usage statistics and logs</li>
                          <li>• Update configuration as needed</li>
                          <li>• Scale resources if required</li>
                          <li>• Backup configuration settings</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Navigation */}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={handlePrevStep} className="gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Previous: Testing
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!isFormValid() || finalTestResult !== 'success'}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Deploy MCP Tool
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
