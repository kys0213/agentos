import {
  AlertTriangle,
  BookOpen,
  Bot,
  Brain,
  Code,
  Database,
  Download,
  MessageSquare,
  Monitor,
  Moon,
  Network,
  RotateCcw,
  Save,
  Search,
  Settings,
  Shield,
  Sun,
  Trash2,
  Upload,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

interface SettingsData {
  general: {
    language: string;
    theme: string;
    startupScreen: string;
    notifications: boolean;
    autoSave: boolean;
    confirmExit: boolean;
  };
  chat: {
    defaultMode: string;
    autoSelectAgent: boolean;
    showReasoningSteps: boolean;
    messageHistory: number;
    responseTimeout: number;
    typingIndicator: boolean;
    soundEffects: boolean;
  };
  agents: {
    defaultAgent: string;
    maxActiveAgents: number;
    agentTimeout: number;
    orchestrationEnabled: boolean;
    reasoningDepth: string;
    fallbackBehavior: string;
  };
  models: {
    defaultModel: string;
    temperature: number;
    maxTokens: number;
    topP: number;
    frequencyPenalty: number;
    presencePenalty: number;
    timeout: number;
  };
  knowledge: {
    searchEngine: string;
    embeddingModel: string;
    vectorDbType: string;
    vectorDbEndpoint: string;
    vectorDbApiKey: string;
    chunkSize: number;
    chunkOverlap: number;
    maxSearchResults: number;
    similarityThreshold: number;
    enableAutoIndexing: boolean;
    cacheEmbeddings: boolean;
  };
  security: {
    dataRetention: number;
    logLevel: string;
    anonymizeData: boolean;
    allowExternalConnections: boolean;
    encryptStorage: boolean;
    requireAuth: boolean;
  };
  advanced: {
    debugMode: boolean;
    experimentalFeatures: boolean;
    developerMode: boolean;
    logToFile: boolean;
    performanceMonitoring: boolean;
    crashReporting: boolean;
  };
}

export function SettingsManager() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SettingsData>({
    general: {
      language: 'ko',
      theme: theme,
      startupScreen: 'chat',
      notifications: true,
      autoSave: true,
      confirmExit: false,
    },
    chat: {
      defaultMode: 'orchestration',
      autoSelectAgent: true,
      showReasoningSteps: true,
      messageHistory: 30,
      responseTimeout: 30,
      typingIndicator: true,
      soundEffects: false,
    },
    agents: {
      defaultAgent: 'orchestrator',
      maxActiveAgents: 5,
      agentTimeout: 60,
      orchestrationEnabled: true,
      reasoningDepth: 'detailed',
      fallbackBehavior: 'main-agent',
    },
    models: {
      defaultModel: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      topP: 1.0,
      frequencyPenalty: 0.0,
      presencePenalty: 0.0,
      timeout: 30,
    },
    knowledge: {
      searchEngine: 'bm25',
      embeddingModel: 'text-embedding-3-small',
      vectorDbType: 'none',
      vectorDbEndpoint: '',
      vectorDbApiKey: '',
      chunkSize: 1000,
      chunkOverlap: 200,
      maxSearchResults: 5,
      similarityThreshold: 0.7,
      enableAutoIndexing: true,
      cacheEmbeddings: true,
    },
    security: {
      dataRetention: 30,
      logLevel: 'info',
      anonymizeData: true,
      allowExternalConnections: true,
      encryptStorage: true,
      requireAuth: false,
    },
    advanced: {
      debugMode: false,
      experimentalFeatures: false,
      developerMode: false,
      logToFile: true,
      performanceMonitoring: true,
      crashReporting: true,
    },
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync theme changes with settings state
  useEffect(() => {
    setSettings(prev => ({
      ...prev,
      general: {
        ...prev.general,
        theme: theme,
      }
    }));
  }, [theme]);

  const updateSetting = <C extends keyof SettingsData, K extends keyof SettingsData[C]>(
    category: C,
    key: K,
    value: SettingsData[C][K]
  ) => {
    // Special handling for theme changes
    if (category === 'general' && key === 'theme') {
      setTheme(value as 'light' | 'dark' | 'system');
    }
    
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
    setHasChanges(false);
  };

  const handleReset = () => {
    // Reset to default values
    setHasChanges(false);
  };

  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agentos-settings.json';
    link.click();
  };

  const testVectorDbConnection = async () => {
    // Simulate connection test
    await new Promise((resolve) => setTimeout(resolve, 1000));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
            <p className="text-muted-foreground">Configure AgentOS preferences and behavior</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportSettings} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={!hasChanges}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
            <Button onClick={handleSave} disabled={!hasChanges || isSaving} className="gap-2">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">You have unsaved changes</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="general" className="gap-2">
                <Settings className="w-4 h-4" />
                General
              </TabsTrigger>
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="agents" className="gap-2">
                <Bot className="w-4 h-4" />
                Agents
              </TabsTrigger>
              <TabsTrigger value="models" className="gap-2">
                <Brain className="w-4 h-4" />
                Models
              </TabsTrigger>
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-2">
                <Shield className="w-4 h-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="advanced" className="gap-2">
                <Code className="w-4 h-4" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <ScrollArea className="h-full">
              <div className="space-y-6 py-4">
                <TabsContent value="general" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="theme">Theme</Label>
                          <Select
                            value={settings.general.theme}
                            onValueChange={(value) => updateSetting('general', 'theme', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="light">
                                <div className="flex items-center gap-2">
                                  <Sun className="w-4 h-4" />
                                  Light
                                </div>
                              </SelectItem>
                              <SelectItem value="dark">
                                <div className="flex items-center gap-2">
                                  <Moon className="w-4 h-4" />
                                  Dark
                                </div>
                              </SelectItem>
                              <SelectItem value="system">
                                <div className="flex items-center gap-2">
                                  <Monitor className="w-4 h-4" />
                                  System
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="language">Language</Label>
                          <Select
                            value={settings.general.language}
                            onValueChange={(value) => updateSetting('general', 'language', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ko">한국어</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="ja">日本語</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="startup">Startup Screen</Label>
                        <Select
                          value={settings.general.startupScreen}
                          onValueChange={(value) =>
                            updateSetting('general', 'startupScreen', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="chat">Chat</SelectItem>
                            <SelectItem value="dashboard">Dashboard</SelectItem>
                            <SelectItem value="last-used">Last Used Screen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Behavior</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Enable notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Show system notifications for important events
                          </p>
                        </div>
                        <Switch
                          checked={settings.general.notifications}
                          onCheckedChange={(checked) =>
                            updateSetting('general', 'notifications', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-save settings</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically save configuration changes
                          </p>
                        </div>
                        <Switch
                          checked={settings.general.autoSave}
                          onCheckedChange={(checked) =>
                            updateSetting('general', 'autoSave', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Confirm before exit</Label>
                          <p className="text-sm text-muted-foreground">
                            Show confirmation dialog when closing the application
                          </p>
                        </div>
                        <Switch
                          checked={settings.general.confirmExit}
                          onCheckedChange={(checked) =>
                            updateSetting('general', 'confirmExit', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="chat" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Default Behavior</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default chat mode</Label>
                        <Select
                          value={settings.chat.defaultMode}
                          onValueChange={(value) => updateSetting('chat', 'defaultMode', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orchestration">Orchestration Mode</SelectItem>
                            <SelectItem value="direct">Direct Mode</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-select agents</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically select appropriate agents based on context
                          </p>
                        </div>
                        <Switch
                          checked={settings.chat.autoSelectAgent}
                          onCheckedChange={(checked) =>
                            updateSetting('chat', 'autoSelectAgent', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Show reasoning steps</Label>
                          <p className="text-sm text-muted-foreground">
                            Display the orchestrator's decision-making process
                          </p>
                        </div>
                        <Switch
                          checked={settings.chat.showReasoningSteps}
                          onCheckedChange={(checked) =>
                            updateSetting('chat', 'showReasoningSteps', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Message Management
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Message history retention (days)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.chat.messageHistory]}
                            onValueChange={([value]) =>
                              updateSetting('chat', 'messageHistory', value)
                            }
                            max={365}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.chat.messageHistory}d
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Response timeout (seconds)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.chat.responseTimeout]}
                            onValueChange={([value]) =>
                              updateSetting('chat', 'responseTimeout', value)
                            }
                            max={120}
                            min={5}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.chat.responseTimeout}s
                          </span>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Typing indicator</Label>
                          <p className="text-sm text-muted-foreground">
                            Show when agents are processing responses
                          </p>
                        </div>
                        <Switch
                          checked={settings.chat.typingIndicator}
                          onCheckedChange={(checked) =>
                            updateSetting('chat', 'typingIndicator', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Sound effects</Label>
                          <p className="text-sm text-muted-foreground">
                            Play sounds for message notifications
                          </p>
                        </div>
                        <Switch
                          checked={settings.chat.soundEffects}
                          onCheckedChange={(checked) =>
                            updateSetting('chat', 'soundEffects', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="agents" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Agent Configuration
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default agent</Label>
                        <Select
                          value={settings.agents.defaultAgent}
                          onValueChange={(value) => updateSetting('agents', 'defaultAgent', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="orchestrator">AgentOS Orchestrator</SelectItem>
                            <SelectItem value="general">General Assistant</SelectItem>
                            <SelectItem value="code">Code Assistant</SelectItem>
                            <SelectItem value="research">Research Assistant</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum active agents</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.agents.maxActiveAgents]}
                            onValueChange={([value]) =>
                              updateSetting('agents', 'maxActiveAgents', value)
                            }
                            max={10}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-8">
                            {settings.agents.maxActiveAgents}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Agent timeout (seconds)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.agents.agentTimeout]}
                            onValueChange={([value]) =>
                              updateSetting('agents', 'agentTimeout', value)
                            }
                            max={300}
                            min={30}
                            step={10}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.agents.agentTimeout}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Orchestration</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Enable orchestration</Label>
                          <p className="text-sm text-muted-foreground">
                            Allow the main agent to coordinate multiple specialists
                          </p>
                        </div>
                        <Switch
                          checked={settings.agents.orchestrationEnabled}
                          onCheckedChange={(checked) =>
                            updateSetting('agents', 'orchestrationEnabled', checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Reasoning depth</Label>
                        <Select
                          value={settings.agents.reasoningDepth}
                          onValueChange={(value) =>
                            updateSetting('agents', 'reasoningDepth', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minimal">Minimal</SelectItem>
                            <SelectItem value="basic">Basic</SelectItem>
                            <SelectItem value="detailed">Detailed</SelectItem>
                            <SelectItem value="verbose">Verbose</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Fallback behavior</Label>
                        <Select
                          value={settings.agents.fallbackBehavior}
                          onValueChange={(value) =>
                            updateSetting('agents', 'fallbackBehavior', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="main-agent">Use main agent</SelectItem>
                            <SelectItem value="ask-user">Ask user</SelectItem>
                            <SelectItem value="error">Show error</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="models" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Default Model</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Model selection</Label>
                        <Select
                          value={settings.models.defaultModel}
                          onValueChange={(value) => updateSetting('models', 'defaultModel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="claude-3">Claude 3</SelectItem>
                            <SelectItem value="local-model">Local Model</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Request timeout (seconds)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.models.timeout]}
                            onValueChange={([value]) => updateSetting('models', 'timeout', value)}
                            max={120}
                            min={5}
                            step={5}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.models.timeout}s
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Model Parameters</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Temperature</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.models.temperature]}
                            onValueChange={([value]) =>
                              updateSetting('models', 'temperature', value)
                            }
                            max={2}
                            min={0}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.models.temperature}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Max tokens</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.models.maxTokens]}
                            onValueChange={([value]) => updateSetting('models', 'maxTokens', value)}
                            max={4096}
                            min={256}
                            step={256}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-16">
                            {settings.models.maxTokens}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Top P</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.models.topP]}
                            onValueChange={([value]) => updateSetting('models', 'topP', value)}
                            max={1}
                            min={0}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.models.topP}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="knowledge" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Search Engine</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default search method</Label>
                        <Select
                          value={settings.knowledge.searchEngine}
                          onValueChange={(value) =>
                            updateSetting('knowledge', 'searchEngine', value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="bm25">
                              <div className="flex items-center gap-2">
                                <Search className="w-4 h-4" />
                                BM25 (Local)
                              </div>
                            </SelectItem>
                            <SelectItem value="vector">
                              <div className="flex items-center gap-2">
                                <Database className="w-4 h-4" />
                                Vector Search
                              </div>
                            </SelectItem>
                            <SelectItem value="hybrid">
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" />
                                Hybrid (BM25 + Vector)
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-muted-foreground">
                          BM25 provides fast local search without external dependencies. Vector
                          search offers semantic similarity.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Maximum search results</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.knowledge.maxSearchResults]}
                            onValueChange={([value]) =>
                              updateSetting('knowledge', 'maxSearchResults', value)
                            }
                            max={20}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-8">
                            {settings.knowledge.maxSearchResults}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Auto-indexing</Label>
                          <p className="text-sm text-muted-foreground">
                            Automatically index new documents when added
                          </p>
                        </div>
                        <Switch
                          checked={settings.knowledge.enableAutoIndexing}
                          onCheckedChange={(checked) =>
                            updateSetting('knowledge', 'enableAutoIndexing', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  {(settings.knowledge.searchEngine === 'vector' ||
                    settings.knowledge.searchEngine === 'hybrid') && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Vector Database
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Vector database type</Label>
                          <Select
                            value={settings.knowledge.vectorDbType}
                            onValueChange={(value) =>
                              updateSetting('knowledge', 'vectorDbType', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None (Disable Vector Search)</SelectItem>
                              <SelectItem value="pinecone">Pinecone</SelectItem>
                              <SelectItem value="qdrant">Qdrant</SelectItem>
                              <SelectItem value="weaviate">Weaviate</SelectItem>
                              <SelectItem value="chroma">ChromaDB</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {settings.knowledge.vectorDbType !== 'none' && (
                          <>
                            <div className="space-y-2">
                              <Label>Endpoint URL</Label>
                              <Input
                                type="url"
                                placeholder="https://your-vector-db-endpoint.com"
                                value={settings.knowledge.vectorDbEndpoint}
                                onChange={(e) =>
                                  updateSetting('knowledge', 'vectorDbEndpoint', e.target.value)
                                }
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>API Key</Label>
                              <Input
                                type="password"
                                placeholder="Your API key"
                                value={settings.knowledge.vectorDbApiKey}
                                onChange={(e) =>
                                  updateSetting('knowledge', 'vectorDbApiKey', e.target.value)
                                }
                              />
                            </div>

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={testVectorDbConnection}
                                className="gap-2"
                              >
                                <Network className="w-4 h-4" />
                                Test Connection
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </Card>
                  )}

                  {(settings.knowledge.searchEngine === 'vector' ||
                    settings.knowledge.searchEngine === 'hybrid') && (
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold text-foreground mb-4">
                        Embedding Configuration
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Embedding model</Label>
                          <Select
                            value={settings.knowledge.embeddingModel}
                            onValueChange={(value) =>
                              updateSetting('knowledge', 'embeddingModel', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text-embedding-3-small">
                                OpenAI text-embedding-3-small
                              </SelectItem>
                              <SelectItem value="text-embedding-3-large">
                                OpenAI text-embedding-3-large
                              </SelectItem>
                              <SelectItem value="text-embedding-ada-002">
                                OpenAI text-embedding-ada-002
                              </SelectItem>
                              <SelectItem value="sentence-transformers">
                                Local Sentence Transformers
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Chunk size (characters)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[settings.knowledge.chunkSize]}
                              onValueChange={([value]) =>
                                updateSetting('knowledge', 'chunkSize', value)
                              }
                              max={4000}
                              min={200}
                              step={100}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-16">
                              {settings.knowledge.chunkSize}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Chunk overlap (characters)</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[settings.knowledge.chunkOverlap]}
                              onValueChange={([value]) =>
                                updateSetting('knowledge', 'chunkOverlap', value)
                              }
                              max={Math.min(500, settings.knowledge.chunkSize / 2)}
                              min={0}
                              step={50}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-16">
                              {settings.knowledge.chunkOverlap}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Similarity threshold</Label>
                          <div className="flex items-center gap-4">
                            <Slider
                              value={[settings.knowledge.similarityThreshold]}
                              onValueChange={([value]) =>
                                updateSetting('knowledge', 'similarityThreshold', value)
                              }
                              max={1}
                              min={0}
                              step={0.1}
                              className="flex-1"
                            />
                            <span className="text-sm text-muted-foreground w-12">
                              {settings.knowledge.similarityThreshold}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Label>Cache embeddings</Label>
                            <p className="text-sm text-muted-foreground">
                              Store embeddings locally to reduce API calls
                            </p>
                          </div>
                          <Switch
                            checked={settings.knowledge.cacheEmbeddings}
                            onCheckedChange={(checked) =>
                              updateSetting('knowledge', 'cacheEmbeddings', checked)
                            }
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Data Privacy</h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Data retention period (days)</Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[settings.security.dataRetention]}
                            onValueChange={([value]) =>
                              updateSetting('security', 'dataRetention', value)
                            }
                            max={365}
                            min={1}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-sm text-muted-foreground w-12">
                            {settings.security.dataRetention}d
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Anonymize sensitive data</Label>
                          <p className="text-sm text-muted-foreground">
                            Remove personally identifiable information from logs
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.anonymizeData}
                          onCheckedChange={(checked) =>
                            updateSetting('security', 'anonymizeData', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Encrypt local storage</Label>
                          <p className="text-sm text-muted-foreground">
                            Encrypt chat history and settings on disk
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.encryptStorage}
                          onCheckedChange={(checked) =>
                            updateSetting('security', 'encryptStorage', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Access Control</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Require authentication</Label>
                          <p className="text-sm text-muted-foreground">
                            Require login to access the application
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.requireAuth}
                          onCheckedChange={(checked) =>
                            updateSetting('security', 'requireAuth', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Allow external connections</Label>
                          <p className="text-sm text-muted-foreground">
                            Permit connections to external APIs and services
                          </p>
                        </div>
                        <Switch
                          checked={settings.security.allowExternalConnections}
                          onCheckedChange={(checked) =>
                            updateSetting('security', 'allowExternalConnections', checked)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Log level</Label>
                        <Select
                          value={settings.security.logLevel}
                          onValueChange={(value) => updateSetting('security', 'logLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="error">Error only</SelectItem>
                            <SelectItem value="warn">Warning & Error</SelectItem>
                            <SelectItem value="info">Info, Warning & Error</SelectItem>
                            <SelectItem value="debug">All (Debug mode)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="advanced" className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Developer Options
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Debug mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable detailed debugging information
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.debugMode}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'debugMode', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Developer mode</Label>
                          <p className="text-sm text-muted-foreground">
                            Access to advanced features and tools
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.developerMode}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'developerMode', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Experimental features</Label>
                          <p className="text-sm text-muted-foreground">
                            Enable beta features (may be unstable)
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.experimentalFeatures}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'experimentalFeatures', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      System Monitoring
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Performance monitoring</Label>
                          <p className="text-sm text-muted-foreground">
                            Track system performance metrics
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.performanceMonitoring}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'performanceMonitoring', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Log to file</Label>
                          <p className="text-sm text-muted-foreground">
                            Save logs to local files for debugging
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.logToFile}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'logToFile', checked)
                          }
                        />
                      </div>

                      <Separator />

                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label>Crash reporting</Label>
                          <p className="text-sm text-muted-foreground">
                            Send crash reports to help improve the app
                          </p>
                        </div>
                        <Switch
                          checked={settings.advanced.crashReporting}
                          onCheckedChange={(checked) =>
                            updateSetting('advanced', 'crashReporting', checked)
                          }
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Data Management</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Button variant="outline" className="gap-2">
                          <Download className="w-4 h-4" />
                          Export All Data
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Upload className="w-4 h-4" />
                          Import Data
                        </Button>
                        <Button variant="destructive" className="gap-2">
                          <Trash2 className="w-4 h-4" />
                          Clear All Data
                        </Button>
                      </div>
                    </div>
                  </Card>
                </TabsContent>
              </div>
            </ScrollArea>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
