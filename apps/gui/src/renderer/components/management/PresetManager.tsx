import {
  Bot,
  Calendar,
  CheckCircle2,
  Code,
  Copy,
  Cpu,
  Edit,
  Eye,
  Filter,
  Layers,
  Plus,
  Search,
  Settings,
  Upload,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

// Types based on the core interface
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
  llmBridgeConfig: Record<string, unknown>;
}

interface EnabledMcp {
  name: string;
  version?: string;
  enabledTools: string[];
  enabledResources: string[];
  enabledPrompts: string[];
}

export function PresetManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const presets: Preset[] = [
    {
      id: '1',
      name: 'Data Analysis Expert',
      description: 'Specialized in data analysis, visualization, and statistical computing',
      author: 'System',
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
      version: '1.2.0',
      systemPrompt: 'You are a data analysis expert...',
      llmBridgeName: 'openai-gpt4',
      llmBridgeConfig: { temperature: 0.1, max_tokens: 2000 },
      enabledMcps: [
        {
          name: 'python-executor',
          enabledTools: ['execute_python', 'install_package'],
          enabledResources: ['data_files'],
          enabledPrompts: ['analysis_template'],
        },
      ],
    },
    {
      id: '2',
      name: 'Code Review Specialist',
      description: 'Expert in code quality, security analysis, and best practices',
      author: 'DevTeam',
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-18'),
      version: '2.1.0',
      systemPrompt: 'You are a senior software engineer...',
      llmBridgeName: 'openai-gpt4',
      llmBridgeConfig: { temperature: 0.2, max_tokens: 3000 },
      enabledMcps: [
        {
          name: 'github-integration',
          enabledTools: ['analyze_pr', 'suggest_changes'],
          enabledResources: ['code_repositories'],
          enabledPrompts: ['review_template'],
        },
      ],
    },
    {
      id: '3',
      name: 'Creative Writer',
      description: 'Specialized in creative writing, storytelling, and content creation',
      author: 'ContentTeam',
      createdAt: new Date('2024-01-12'),
      updatedAt: new Date('2024-01-19'),
      version: '1.0.0',
      systemPrompt: 'You are a creative writing assistant...',
      llmBridgeName: 'openai-gpt4',
      llmBridgeConfig: { temperature: 0.8, max_tokens: 4000 },
      enabledMcps: [],
    },
    {
      id: '4',
      name: 'Research Assistant',
      description: 'Expert in research, fact-checking, and information synthesis',
      author: 'Research',
      createdAt: new Date('2024-01-08'),
      updatedAt: new Date('2024-01-22'),
      version: '1.5.0',
      systemPrompt: 'You are a research specialist...',
      llmBridgeName: 'anthropic-claude',
      llmBridgeConfig: { temperature: 0.3, max_tokens: 3500 },
      enabledMcps: [
        {
          name: 'web-search',
          enabledTools: ['search_web', 'fetch_content'],
          enabledResources: ['web_sources'],
          enabledPrompts: ['research_template'],
        },
      ],
    },
  ];

  const categories = [
    { id: 'all', label: 'All Presets', count: presets.length },
    { id: 'data', label: 'Data & Analytics', count: 1 },
    { id: 'development', label: 'Development', count: 1 },
    { id: 'creative', label: 'Creative', count: 1 },
    { id: 'research', label: 'Research', count: 1 },
  ];

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    // Simple category filtering - in real app this would be more sophisticated
    return matchesSearch;
  });

  const getModelIcon = (bridgeName: string) => {
    if (bridgeName.includes('gpt')) return <Bot className="w-4 h-4" />;
    if (bridgeName.includes('claude')) return <Cpu className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Preset Manager</h1>
          <p className="text-muted-foreground">
            Create and manage AI agent presets and configurations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Preset
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search presets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Categories */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="flex-shrink-0"
          >
            {category.label}
            <Badge variant="secondary" className="ml-2 text-xs">
              {category.count}
            </Badge>
          </Button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPresets.map((preset) => (
          <Card key={preset.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Layers className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{preset.name}</h3>
                  <p className="text-xs text-muted-foreground">v{preset.version}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{preset.description}</p>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Model</span>
                <div className="flex items-center gap-1">
                  {getModelIcon(preset.llmBridgeName)}
                  <span className="font-medium text-xs">
                    {preset.llmBridgeName.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Author</span>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="font-medium text-xs">{preset.author}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span className="font-medium text-xs">{formatDate(preset.updatedAt)}</span>
                </div>
              </div>

              {preset.enabledMcps && preset.enabledMcps.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">MCP Tools</p>
                  <div className="flex flex-wrap gap-1">
                    {preset.enabledMcps.map((mcp, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {mcp.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-4 border-t">
              <Button size="sm" className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                View
              </Button>
              <Button variant="outline" size="sm">
                <Copy className="w-3 h-3" />
              </Button>
              <Button variant="outline" size="sm">
                <Edit className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">{presets.length}</p>
              <p className="text-xs text-muted-foreground">Total Presets</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {presets.filter((p) => p.enabledMcps?.length).length}
              </p>
              <p className="text-xs text-muted-foreground">With MCP Tools</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">3</p>
              <p className="text-xs text-muted-foreground">Model Types</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {
                  presets.filter(
                    (p) => Date.now() - p.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000
                  ).length
                }
              </p>
              <p className="text-xs text-muted-foreground">Recent Updates</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
