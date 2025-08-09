import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { EmptyState } from './EmptyState';
import {
  Plus,
  Search,
  Filter,
  Brain,
  Code,
  FileText,
  BarChart,
  Calendar,
  Users,
  Zap,
  CheckCircle,
  Clock,
  MinusCircle,
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

interface PresetListProps {
  presets: Preset[];
  onSelectPreset: (preset: Preset) => void;
  onCreatePreset: () => void; // Changed to simple callback
}

export function PresetList({ presets, onSelectPreset, onCreatePreset }: PresetListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedModel, setSelectedModel] = useState('all');

  const categories = [
    { id: 'all', label: 'All Categories', count: presets.length },
    {
      id: 'research',
      label: 'Research',
      count: presets.filter((p) => p.category === 'research').length,
    },
    {
      id: 'development',
      label: 'Development',
      count: presets.filter((p) => p.category === 'development').length,
    },
    {
      id: 'creative',
      label: 'Creative',
      count: presets.filter((p) => p.category === 'creative').length,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      count: presets.filter((p) => p.category === 'analytics').length,
    },
  ];

  const models = [
    { id: 'all', label: 'All Models', count: presets.length },
    { id: 'gpt-4', label: 'GPT-4', count: presets.filter((p) => p.model === 'gpt-4').length },
    {
      id: 'claude-3-5-sonnet',
      label: 'Claude 3.5 Sonnet',
      count: presets.filter((p) => p.model === 'claude-3-5-sonnet').length,
    },
    {
      id: 'claude-3-haiku',
      label: 'Claude 3 Haiku',
      count: presets.filter((p) => p.model === 'claude-3-haiku').length,
    },
  ];

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || preset.category === selectedCategory;
    const matchesModel = selectedModel === 'all' || preset.model === selectedModel;
    return matchesSearch && matchesCategory && matchesModel;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Search className="w-4 h-4" />;
      case 'development':
        return <Code className="w-4 h-4" />;
      case 'creative':
        return <FileText className="w-4 h-4" />;
      case 'analytics':
        return <BarChart className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="status-active gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="status-idle gap-1">
            <Clock className="w-3 h-3" />
            Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="status-inactive-subtle gap-1">
            <MinusCircle className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return null;
    }
  };

  // Show empty state if no presets
  if (presets.length === 0) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="max-w-md">
          <EmptyState
            type="presets"
            title="No Presets Yet"
            description="Create your first AI preset to define specialized behaviors for your agents. Presets contain system prompts, model settings, and tool configurations."
            actionLabel="Create First Preset"
            onAction={onCreatePreset}
            secondaryAction={{
              label: 'Import Template',
              onClick: () => console.log('Import preset template'),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Presets</h1>
            <p className="text-muted-foreground">Manage AI agent presets and configurations</p>
          </div>

          <Button onClick={onCreatePreset} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Preset
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{presets.length}</p>
                <p className="text-sm text-muted-foreground">Total Presets</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {presets.filter((p) => p.status === 'active').length}
                </p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {presets.reduce((sum, p) => sum + p.usageCount, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Usage</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">
                  {presets.reduce((sum, p) => sum + p.knowledgeDocuments, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Knowledge Docs</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search presets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.label} ({category.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.label} ({model.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Preset Grid */}
      <div className="flex-1 min-h-0 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => (
            <Card
              key={preset.id}
              className="p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectPreset(preset)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    {getCategoryIcon(preset.category)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{preset.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{preset.category}</p>
                  </div>
                </div>
                {getStatusBadge(preset.status)}
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {preset.description}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Model:</span>
                  <span className="font-medium">{preset.model}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Usage:</span>
                  <span className="font-medium">{preset.usageCount} times</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Knowledge:</span>
                  <span className="font-medium">{preset.knowledgeDocuments} docs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">{preset.updatedAt.toLocaleDateString()}</span>
                </div>
              </div>

              {/* Tools */}
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Tools:</p>
                <div className="flex flex-wrap gap-1">
                  {preset.tools.slice(0, 3).map((tool, index) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                    >
                      {tool}
                    </span>
                  ))}
                  {preset.tools.length > 3 && (
                    <span className="text-xs text-muted-foreground">
                      +{preset.tools.length - 3}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {preset.createdAt.toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">Click to configure</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
