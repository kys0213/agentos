import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { AlertCircle, CheckCircle, Loader2, Terminal, Globe, Wifi, Zap, Plus, X } from "lucide-react";

// MCP Types based on the provided interface
export interface NetworkConfig {
  timeoutMs?: number;
  maxTotalTimeoutMs?: number;
  maxConnectionIdleTimeoutMs?: number;
}

export interface BaseMcpConfig {
  type: 'stdio' | 'streamableHttp' | 'websocket' | 'sse';
  name: string;
  version: string;
  network?: NetworkConfig;
}

export interface StdioMcpConfig extends BaseMcpConfig {
  type: 'stdio';
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
}

export interface StreamableHttpMcpConfig extends BaseMcpConfig {
  type: 'streamableHttp';
  url: string;
  headers?: Record<string, string>;
  authProvider?: any; // OAuthClientProvider type placeholder
  reconnectionOptions?: any; // StreamableHTTPReconnectionOptions placeholder
}

export interface WebSocketMcpConfig extends BaseMcpConfig {
  type: 'websocket';
  url: string;
}

export interface SseMcpConfig extends BaseMcpConfig {
  type: 'sse';
  url: string;
  headers?: Record<string, string>;
  authProvider?: any; // OAuthClientProvider type placeholder
}

export type McpConfig = StdioMcpConfig | StreamableHttpMcpConfig | WebSocketMcpConfig | SseMcpConfig;

interface MCPToolAddProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (mcpConfig: McpConfig) => void;
}

export function MCPToolAdd({ isOpen, onClose, onAdd }: MCPToolAddProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [connectionType, setConnectionType] = useState<'stdio' | 'streamableHttp' | 'websocket' | 'sse'>('stdio');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<'success' | 'error' | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<McpConfig>>({
    type: 'stdio',
    name: '',
    version: '1.0.0',
    network: {
      timeoutMs: 5000,
      maxTotalTimeoutMs: 30000,
      maxConnectionIdleTimeoutMs: 60000
    }
  });

  // Environment variables for stdio
  const [envVars, setEnvVars] = useState<Array<{ key: string; value: string }>>([]);
  const [headers, setHeaders] = useState<Array<{ key: string; value: string }>>([]);

  const connectionTypes = [
    {
      type: 'stdio' as const,
      name: 'Standard I/O',
      description: 'Local process communication via stdin/stdout',
      icon: <Terminal className="w-5 h-5" />,
      recommended: true
    },
    {
      type: 'streamableHttp' as const,
      name: 'HTTP Streaming',
      description: 'HTTP-based streaming connection',
      icon: <Globe className="w-5 h-5" />,
      recommended: false
    },
    {
      type: 'websocket' as const,
      name: 'WebSocket',
      description: 'Real-time bidirectional communication',
      icon: <Wifi className="w-5 h-5" />,
      recommended: false
    },
    {
      type: 'sse' as const,
      name: 'Server-Sent Events',
      description: 'Server-sent events (deprecated)',
      icon: <Zap className="w-5 h-5" />,
      deprecated: true
    }
  ];

  const updateFormData = (updates: Partial<McpConfig>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleConnectionTypeChange = (type: 'stdio' | 'streamableHttp' | 'websocket' | 'sse') => {
    setConnectionType(type);
    updateFormData({ type });
    setCurrentStep(2);
  };

  const addEnvVar = () => {
    setEnvVars(prev => [...prev, { key: '', value: '' }]);
  };

  const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
    setEnvVars(prev => prev.map((env, i) => 
      i === index ? { ...env, [field]: value } : env
    ));
  };

  const removeEnvVar = (index: number) => {
    setEnvVars(prev => prev.filter((_, i) => i !== index));
  };

  const addHeader = () => {
    setHeaders(prev => [...prev, { key: '', value: '' }]);
  };

  const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
    setHeaders(prev => prev.map((header, i) => 
      i === index ? { ...header, [field]: value } : header
    ));
  };

  const removeHeader = (index: number) => {
    setHeaders(prev => prev.filter((_, i) => i !== index));
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestResult(null);
    
    // Simulate connection test
    setTimeout(() => {
      setIsTestingConnection(false);
      setConnectionTestResult(Math.random() > 0.3 ? 'success' : 'error');
    }, 2000);
  };

  const handleAdd = () => {
    // Build final config based on type
    let finalConfig: McpConfig;
    
    const envObj = envVars.reduce((acc, env) => {
      if (env.key && env.value) acc[env.key] = env.value;
      return acc;
    }, {} as Record<string, string>);
    
    const headersObj = headers.reduce((acc, header) => {
      if (header.key && header.value) acc[header.key] = header.value;
      return acc;
    }, {} as Record<string, string>);

    switch (connectionType) {
      case 'stdio':
        finalConfig = {
          ...formData,
          type: 'stdio',
          command: (formData as StdioMcpConfig).command || '',
          args: (formData as StdioMcpConfig).args || [],
          env: Object.keys(envObj).length > 0 ? envObj : undefined,
          cwd: (formData as StdioMcpConfig).cwd
        } as StdioMcpConfig;
        break;
      case 'streamableHttp':
        finalConfig = {
          ...formData,
          type: 'streamableHttp',
          url: (formData as StreamableHttpMcpConfig).url || '',
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined
        } as StreamableHttpMcpConfig;
        break;
      case 'websocket':
        finalConfig = {
          ...formData,
          type: 'websocket',
          url: (formData as WebSocketMcpConfig).url || ''
        } as WebSocketMcpConfig;
        break;
      case 'sse':
        finalConfig = {
          ...formData,
          type: 'sse',
          url: (formData as SseMcpConfig).url || '',
          headers: Object.keys(headersObj).length > 0 ? headersObj : undefined
        } as SseMcpConfig;
        break;
      default:
        return;
    }

    onAdd(finalConfig);
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep(1);
    setConnectionType('stdio');
    setFormData({
      type: 'stdio',
      name: '',
      version: '1.0.0',
      network: {
        timeoutMs: 5000,
        maxTotalTimeoutMs: 30000,
        maxConnectionIdleTimeoutMs: 60000
      }
    });
    setEnvVars([]);
    setHeaders([]);
    setConnectionTestResult(null);
    onClose();
  };

  const isStepValid = () => {
    if (currentStep === 1) return true;
    if (currentStep === 2) {
      if (!formData.name || !formData.version) return false;
      switch (connectionType) {
        case 'stdio':
          return !!(formData as StdioMcpConfig).command;
        case 'streamableHttp':
        case 'websocket':
        case 'sse':
          return !!(formData as any).url;
        default:
          return false;
      }
    }
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add MCP Tool</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Connection Type</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Configuration</span>
            </div>
            <div className="w-8 h-px bg-border"></div>
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 3 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Test & Add</span>
            </div>
          </div>

          {/* Step 1: Connection Type Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-foreground mb-2">Choose Connection Type</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Select how your MCP tool will communicate with the system.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {connectionTypes.map((type) => (
                  <Card
                    key={type.type}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      connectionType === type.type ? 'ring-2 ring-primary bg-primary/5' : ''
                    } ${type.deprecated ? 'opacity-60' : ''}`}
                    onClick={() => !type.deprecated && handleConnectionTypeChange(type.type)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {type.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground">{type.name}</h4>
                          {type.recommended && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Recommended
                            </Badge>
                          )}
                          {type.deprecated && (
                            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                              Deprecated
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Configuration */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Configure Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Set up the connection parameters for your {connectionTypes.find(t => t.type === connectionType)?.name} MCP tool.
                </p>
              </div>

              {/* Basic Information */}
              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mcp-name">Tool Name *</Label>
                    <Input
                      id="mcp-name"
                      value={formData.name || ''}
                      onChange={(e) => updateFormData({ name: e.target.value })}
                      placeholder="e.g., my-mcp-tool"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mcp-version">Version</Label>
                    <Input
                      id="mcp-version"
                      value={formData.version || ''}
                      onChange={(e) => updateFormData({ version: e.target.value })}
                      placeholder="1.0.0"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>

              {/* Connection-specific Configuration */}
              {connectionType === 'stdio' && (
                <Card className="p-4">
                  <h4 className="font-medium text-foreground mb-3">Standard I/O Configuration</h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="stdio-command">Command *</Label>
                      <Input
                        id="stdio-command"
                        value={(formData as StdioMcpConfig).command || ''}
                        onChange={(e) => updateFormData({ command: e.target.value })}
                        placeholder="node /path/to/mcp-server.js"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="stdio-args">Arguments (one per line)</Label>
                      <Textarea
                        id="stdio-args"
                        value={((formData as StdioMcpConfig).args || []).join('\n')}
                        onChange={(e) => updateFormData({ 
                          args: e.target.value ? e.target.value.split('\n').filter(Boolean) : []
                        })}
                        placeholder="--config=/path/to/config.json&#10;--verbose"
                        className="mt-1"
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label htmlFor="stdio-cwd">Working Directory</Label>
                      <Input
                        id="stdio-cwd"
                        value={(formData as StdioMcpConfig).cwd || ''}
                        onChange={(e) => updateFormData({ cwd: e.target.value })}
                        placeholder="/path/to/working/directory"
                        className="mt-1"
                      />
                    </div>

                    {/* Environment Variables */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Environment Variables</Label>
                        <Button variant="outline" size="sm" onClick={addEnvVar} className="gap-1">
                          <Plus className="w-3 h-3" />
                          Add Variable
                        </Button>
                      </div>
                      {envVars.map((env, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            placeholder="Variable name"
                            value={env.key}
                            onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={env.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                            className="flex-1"
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
                  </div>
                </Card>
              )}

              {(connectionType === 'streamableHttp' || connectionType === 'websocket' || connectionType === 'sse') && (
                <Card className="p-4">
                  <h4 className="font-medium text-foreground mb-3">
                    {connectionType === 'streamableHttp' ? 'HTTP Streaming' : 
                     connectionType === 'websocket' ? 'WebSocket' : 'Server-Sent Events'} Configuration
                  </h4>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="url">URL *</Label>
                      <Input
                        id="url"
                        value={(formData as any).url || ''}
                        onChange={(e) => updateFormData({ url: e.target.value })}
                        placeholder={
                          connectionType === 'websocket' ? 'ws://localhost:8080/mcp' :
                          connectionType === 'sse' ? 'http://localhost:8080/events' :
                          'http://localhost:8080/mcp'
                        }
                        className="mt-1"
                      />
                    </div>

                    {(connectionType === 'streamableHttp' || connectionType === 'sse') && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Headers</Label>
                          <Button variant="outline" size="sm" onClick={addHeader} className="gap-1">
                            <Plus className="w-3 h-3" />
                            Add Header
                          </Button>
                        </div>
                        {headers.map((header, index) => (
                          <div key={index} className="flex gap-2 mb-2">
                            <Input
                              placeholder="Header name"
                              value={header.key}
                              onChange={(e) => updateHeader(index, 'key', e.target.value)}
                              className="flex-1"
                            />
                            <Input
                              placeholder="Value"
                              value={header.value}
                              onChange={(e) => updateHeader(index, 'value', e.target.value)}
                              className="flex-1"
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
                </Card>
              )}

              {/* Network Configuration */}
              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Network Settings (Optional)</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="timeout">Timeout (ms)</Label>
                    <Input
                      id="timeout"
                      type="number"
                      value={formData.network?.timeoutMs || ''}
                      onChange={(e) => updateFormData({
                        network: {
                          ...formData.network,
                          timeoutMs: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                      placeholder="5000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-timeout">Max Total Timeout (ms)</Label>
                    <Input
                      id="max-timeout"
                      type="number"
                      value={formData.network?.maxTotalTimeoutMs || ''}
                      onChange={(e) => updateFormData({
                        network: {
                          ...formData.network,
                          maxTotalTimeoutMs: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                      placeholder="30000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="idle-timeout">Idle Timeout (ms)</Label>
                    <Input
                      id="idle-timeout"
                      type="number"
                      value={formData.network?.maxConnectionIdleTimeoutMs || ''}
                      onChange={(e) => updateFormData({
                        network: {
                          ...formData.network,
                          maxConnectionIdleTimeoutMs: e.target.value ? parseInt(e.target.value) : undefined
                        }
                      })}
                      placeholder="60000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Step 3: Test & Add */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Test Connection</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Test the connection to ensure your MCP tool is configured correctly.
                </p>
              </div>

              <Card className="p-4">
                <h4 className="font-medium text-foreground mb-3">Configuration Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-medium capitalize">{connectionType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {connectionType === 'stdio' ? 'Command:' : 'URL:'}
                    </span>
                    <span className="font-medium font-mono text-xs">
                      {connectionType === 'stdio' 
                        ? (formData as StdioMcpConfig).command 
                        : (formData as any).url}
                    </span>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-foreground">Connection Test</h4>
                  <Button
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTestingConnection}
                    className="gap-2"
                  >
                    {isTestingConnection ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    {isTestingConnection ? 'Testing...' : 'Test Connection'}
                  </Button>
                </div>

                {connectionTestResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${
                    connectionTestResult === 'success' 
                      ? 'bg-green-50 text-green-800 border border-green-200' 
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {connectionTestResult === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {connectionTestResult === 'success' 
                        ? 'Connection successful! MCP tool is ready to use.' 
                        : 'Connection failed. Please check your configuration.'}
                    </span>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(prev => prev - 1)}
              >
                Previous
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            {currentStep < 3 ? (
              <Button
                onClick={() => setCurrentStep(prev => prev + 1)}
                disabled={!isStepValid()}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleAdd}
                disabled={!isStepValid()}
              >
                Add MCP Tool
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}