import { useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { DynamicFormRenderer, LlmManifest } from "./DynamicFormRenderer";
import { 
  Plus, 
  Settings, 
  Wifi,
  WifiOff,
  Cpu,
  Zap,
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Download,
  Package,
  ExternalLink,
  Search,
  Filter,
  Code,
  MessageSquare,
  Camera,
  RefreshCw
} from "lucide-react";

export function ModelManager() {
  const [activeTab, setActiveTab] = useState("instances");
  const [selectedBridge, setSelectedBridge] = useState<LlmManifest | null>(null);
  const [bridgeConfig, setBridgeConfig] = useState<Record<string, any>>({});
  const [isConfigValid, setIsConfigValid] = useState(false);

  // Mock installed bridges with LlmManifest structure
  const installedBridges: LlmManifest[] = [
    {
      schemaVersion: "1.0.0",
      name: "OpenAI GPT Bridge",
      language: "TypeScript",
      entry: "./bridges/openai/index.ts",
      configSchema: {}, // Zod schema would be here
      capabilities: {
        modalities: ['text', 'image'],
        supportsToolCall: true,
        supportsFunctionCall: true,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: true
      },
      description: "Official OpenAI API bridge supporting GPT-4, GPT-3.5, and vision models",
      version: "2.1.0",
      author: "OpenAI Team",
      homepage: "https://openai.com/api",
      icon: "🤖",
      tags: ["openai", "gpt", "official", "vision"]
    },
    {
      schemaVersion: "1.0.0", 
      name: "Anthropic Claude Bridge",
      language: "TypeScript",
      entry: "./bridges/anthropic/index.ts",
      configSchema: {},
      capabilities: {
        modalities: ['text'],
        supportsToolCall: true,
        supportsFunctionCall: false,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: false
      },
      description: "Anthropic Claude API bridge for advanced reasoning and analysis",
      version: "1.3.0",
      author: "Anthropic Team",
      homepage: "https://anthropic.com",
      icon: "🎭",
      tags: ["anthropic", "claude", "reasoning"]
    },
    {
      schemaVersion: "1.0.0",
      name: "Ollama Local Bridge",
      language: "Python",
      entry: "./bridges/ollama/main.py",
      configSchema: {},
      capabilities: {
        modalities: ['text'],
        supportsToolCall: false,
        supportsFunctionCall: false,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: false
      },
      description: "Local LLM bridge for Ollama-hosted models",
      version: "2.0.0",
      author: "Community",
      homepage: "https://ollama.ai",
      icon: "🦙",
      tags: ["local", "ollama", "self-hosted", "privacy"]
    },
    {
      schemaVersion: "1.0.0",
      name: "Google Gemini Bridge",
      language: "JavaScript",
      entry: "./bridges/gemini/index.js",
      configSchema: {},
      capabilities: {
        modalities: ['text', 'image', 'video'],
        supportsToolCall: true,
        supportsFunctionCall: true,
        supportsMultiTurn: true,
        supportsStreaming: true,
        supportsVision: true
      },
      description: "Google Gemini API bridge with multimodal capabilities",
      version: "1.1.0",
      author: "Google AI",
      homepage: "https://ai.google.dev",
      icon: "💎",
      tags: ["google", "gemini", "multimodal"]
    }
  ];

  // Mock available bridges for installation
  const availableBridges = [
    {
      name: "Azure OpenAI Bridge",
      version: "1.2.0",
      description: "Enterprise-grade OpenAI models via Azure",
      author: "Microsoft",
      downloads: 15420,
      tags: ["azure", "microsoft", "enterprise"],
      language: "C#",
      capabilities: ["text", "vision", "streaming"]
    },
    {
      name: "Hugging Face Inference Bridge", 
      version: "0.9.0",
      description: "Access thousands of models via HF Inference API",
      author: "Hugging Face",
      downloads: 8930,
      tags: ["huggingface", "inference", "community"],
      language: "Python",
      capabilities: ["text", "image", "audio"]
    },
    {
      name: "AWS Bedrock Bridge",
      version: "1.0.0", 
      description: "Amazon Bedrock foundation models",
      author: "AWS",
      downloads: 5670,
      tags: ["aws", "bedrock", "enterprise"],
      language: "TypeScript",
      capabilities: ["text", "embedding"]
    },
    {
      name: "Cohere Bridge",
      version: "0.8.0",
      description: "Cohere's command and embed models",
      author: "Cohere",
      downloads: 3240,
      tags: ["cohere", "embedding", "classification"],
      language: "Python",
      capabilities: ["text", "embedding"]
    }
  ];

  // Mock model instances
  const modelInstances = [
    {
      id: 1,
      name: "GPT-4 Production",
      bridge: "OpenAI GPT Bridge",
      model: "gpt-4-turbo-preview",
      status: "connected",
      requests: 1247,
      cost: "$12.40",
      avgLatency: "850ms",
      lastUsed: "2 minutes ago",
      language: "TypeScript"
    },
    {
      id: 2,
      name: "Claude-3.5 Analysis",
      bridge: "Anthropic Claude Bridge", 
      model: "claude-3-5-sonnet-20241022",
      status: "connected",
      requests: 892,
      cost: "$8.92",
      avgLatency: "720ms", 
      lastUsed: "5 minutes ago",
      language: "TypeScript"
    },
    {
      id: 3,
      name: "Local LLaMA 70B",
      bridge: "Ollama Local Bridge",
      model: "llama3.1:70b",
      status: "error",
      requests: 0,
      cost: "$0.00",
      avgLatency: "N/A",
      lastUsed: "Never",
      language: "Python"
    },
    {
      id: 4,
      name: "Gemini Pro Vision",
      bridge: "Google Gemini Bridge",
      model: "gemini-1.5-pro",
      status: "connected",
      requests: 324,
      cost: "$2.15",
      avgLatency: "680ms",
      lastUsed: "1 hour ago",
      language: "JavaScript"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-600" />;
      case 'paused': return <WifiOff className="w-4 h-4 text-yellow-600" />;
      default: return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected': return 'default';
      case 'error': return 'destructive';
      case 'paused': return 'secondary';
      default: return 'outline';
    }
  };

  const getLanguageColor = (language: string) => {
    switch (language.toLowerCase()) {
      case 'typescript': return 'bg-blue-100 text-blue-700';
      case 'javascript': return 'bg-yellow-100 text-yellow-700';
      case 'python': return 'bg-green-100 text-green-700';
      case 'c#': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleCreateInstance = () => {
    if (selectedBridge && isConfigValid) {
      console.log('Creating instance with config:', bridgeConfig);
      // Handle instance creation
      setSelectedBridge(null);
      setBridgeConfig({});
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">LLM Bridges</h1>
          <p className="text-muted-foreground">Manage LLM bridges and model instances</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instances">Model Instances</TabsTrigger>
          <TabsTrigger value="bridges">Installed Bridges</TabsTrigger>
          <TabsTrigger value="marketplace">Bridge Marketplace</TabsTrigger>
        </TabsList>

        {/* Model Instances Tab */}
        <TabsContent value="instances" className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">3</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">2,463</p>
                  <p className="text-sm text-muted-foreground">Requests</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">$23.47</p>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">750ms</p>
                  <p className="text-sm text-muted-foreground">Avg Latency</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Instances List */}
          <div className="space-y-4">
            {modelInstances.map((instance) => (
              <Card key={instance.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(instance.status)}
                      <div>
                        <h3 className="font-semibold">{instance.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {instance.bridge} • {instance.model}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getStatusBadge(instance.status)} className="capitalize">
                        {instance.status}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getLanguageColor(instance.language)}`}>
                        {instance.language}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Configure
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      Stats
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Requests</p>
                    <p className="font-semibold">{instance.requests.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost</p>
                    <p className="font-semibold">{instance.cost}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Latency</p>
                    <p className="font-semibold">{instance.avgLatency}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Used</p>
                    <p className="font-semibold">{instance.lastUsed}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Create New Instance */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create New Model Instance</h3>
            {!selectedBridge ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Select an installed bridge to create a new model instance:
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {installedBridges.map((bridge) => (
                    <Card 
                      key={bridge.name}
                      className="p-4 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                      onClick={() => setSelectedBridge(bridge)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">{bridge.icon}</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{bridge.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              v{bridge.version}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">{bridge.description}</p>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getLanguageColor(bridge.language)}`}
                            >
                              {bridge.language}
                            </Badge>
                            <div className="flex gap-1">
                              {bridge.capabilities.supportsToolCall && <Code className="w-3 h-3 text-blue-600" />}
                              {bridge.capabilities.supportsMultiTurn && <MessageSquare className="w-3 h-3 text-green-600" />}
                              {bridge.capabilities.supportsVision && <Camera className="w-3 h-3 text-purple-600" />}
                              {bridge.capabilities.supportsStreaming && <RefreshCw className="w-3 h-3 text-orange-600" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Configure {selectedBridge.name}</h4>
                  <Button variant="outline" onClick={() => setSelectedBridge(null)}>
                    Back to Bridge Selection
                  </Button>
                </div>
                
                <DynamicFormRenderer
                  manifest={selectedBridge}
                  values={bridgeConfig}
                  onChange={setBridgeConfig}
                  onValidationChange={setIsConfigValid}
                />
                
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => setSelectedBridge(null)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateInstance}
                    disabled={!isConfigValid}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Instance
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Installed Bridges Tab */}
        <TabsContent value="bridges" className="space-y-4">
          <div className="space-y-4">
            {installedBridges.map((bridge) => (
              <Card key={bridge.name} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <span className="text-3xl">{bridge.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{bridge.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          v{bridge.version}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getLanguageColor(bridge.language)}`}
                        >
                          {bridge.language}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{bridge.description}</p>
                      
                      {/* Capabilities Grid */}
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Modalities</h5>
                          <div className="flex flex-wrap gap-1">
                            {bridge.capabilities.modalities.map(modality => (
                              <Badge key={modality} variant="secondary" className="text-xs">
                                {modality}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h5 className="text-xs font-medium text-muted-foreground mb-1">Features</h5>
                          <div className="flex gap-1">
                            {bridge.capabilities.supportsToolCall && (
                              <div className="flex items-center gap-1">
                                <Code className="w-3 h-3 text-blue-600" />
                                <span className="text-xs">Tools</span>
                              </div>
                            )}
                            {bridge.capabilities.supportsStreaming && (
                              <div className="flex items-center gap-1">
                                <RefreshCw className="w-3 h-3 text-orange-600" />
                                <span className="text-xs">Stream</span>
                              </div>
                            )}
                            {bridge.capabilities.supportsVision && (
                              <div className="flex items-center gap-1">
                                <Camera className="w-3 h-3 text-purple-600" />
                                <span className="text-xs">Vision</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {bridge.tags?.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-1" />
                      Settings
                    </Button>
                    {bridge.homepage && (
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Docs
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Bridge Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search bridges..." className="pl-10" />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="space-y-4">
            {availableBridges.map((bridge) => (
              <Card key={bridge.name} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{bridge.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        v{bridge.version}
                      </Badge>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs ${getLanguageColor(bridge.language)}`}
                      >
                        {bridge.language}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{bridge.description}</p>
                    <p className="text-xs text-muted-foreground mb-2">
                      By {bridge.author} • {bridge.downloads.toLocaleString()} downloads
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-wrap gap-1">
                        {bridge.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-1">
                        {bridge.capabilities.map(cap => (
                          <Badge key={cap} variant="secondary" className="text-xs">
                            {cap}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button>
                    <Download className="w-4 h-4 mr-2" />
                    Install
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}