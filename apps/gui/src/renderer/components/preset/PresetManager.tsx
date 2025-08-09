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
  Heart,
  Layers,
  Plus,
  Search,
  Settings,
  Star,
  Upload,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { useAppData } from '../../hooks/useAppData';
import { Preset } from '@agentos/core';

export function PresetManager() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Use real data from ServiceContainer
  const { presets, loading, handleCreatePreset, handleUpdatePreset, handleDeletePreset } =
    useAppData();

  // Generate categories from real data
  const categories = [
    { id: 'all', label: 'All Presets', count: presets.length },
    {
      id: 'favorites',
      label: 'Favorites',
      count: presets.filter((p) => p.usageCount && p.usageCount > 5).length,
    },
    {
      id: 'recent',
      label: 'Recently Used',
      count: presets.filter((p) => {
        if (!p.updatedAt) return false;
        return Date.now() - p.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
      }).length,
    },
    { id: 'active', label: 'Active', count: presets.filter((p) => p.status === 'active').length },
  ];

  const filteredPresets = presets.filter((preset) => {
    const matchesSearch =
      preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      preset.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filtering based on real data
    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'favorites')
      return matchesSearch && preset.usageCount && preset.usageCount > 5;
    if (selectedCategory === 'recent') {
      if (!preset.updatedAt) return false;
      return matchesSearch && Date.now() - preset.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000;
    }
    if (selectedCategory === 'active') return matchesSearch && preset.status === 'active';

    return matchesSearch;
  });

  const getModelIcon = (bridgeName?: string) => {
    if (!bridgeName) return <Code className="w-4 h-4" />;
    if (bridgeName.includes('gpt')) return <Bot className="w-4 h-4" />;
    if (bridgeName.includes('claude')) return <Cpu className="w-4 h-4" />;
    return <Code className="w-4 h-4" />;
  };

  const toggleFavorite = async (preset: Preset) => {
    const updatedPreset = {
      ...preset,
      usageCount: (preset.usageCount || 0) + (preset.usageCount && preset.usageCount > 5 ? -1 : 1),
    };
    await handleUpdatePreset(updatedPreset);
  };

  const handleCreateNewPreset = async () => {
    const newPreset = handleCreatePreset({
      id: 'new-preset',
      name: 'New Preset',
      description: 'A new preset for AI agents',
      author: 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    });
    console.log('Created preset:', newPreset);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Preset Manager</h1>
            <p className="text-muted-foreground">Loading preset configurations...</p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm">Loading...</span>
          </div>
        </div>

        {/* Loading skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
                <div className="h-12 bg-gray-200 rounded mb-4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Loading State */}
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
          <Button className="gap-2" onClick={handleCreateNewPreset}>
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
        {filteredPresets.length === 0 ? (
          // Empty state
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <Layers className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No presets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? 'Try adjusting your search terms'
                : 'Create your first preset to get started'}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNewPreset} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Preset
              </Button>
            )}
          </div>
        ) : (
          filteredPresets.map((preset) => (
            <Card key={preset.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center relative">
                    <Layers className="w-6 h-6 text-blue-600" />
                    {preset.usageCount && preset.usageCount > 5 && (
                      <Heart className="w-3 h-3 text-red-500 absolute -top-1 -right-1 fill-current" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{preset.name}</h3>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">v{preset.version}</p>
                      {preset.usageCount && preset.usageCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {preset.usageCount} uses
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => toggleFavorite(preset)}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        preset.usageCount && preset.usageCount > 5
                          ? 'text-yellow-500 fill-current'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {preset.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Model</span>
                  <div className="flex items-center gap-1">
                    {getModelIcon(preset.llmBridgeName)}
                    <span className="font-medium text-xs">
                      {(preset.llmBridgeName || 'Default').replace('-', ' ').toUpperCase()}
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
          ))
        )}
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
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {presets.filter((p) => p.usageCount && p.usageCount > 5).length}
              </p>
              <p className="text-xs text-muted-foreground">Favorites</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {new Set(presets.map((p) => p.llmBridgeName).filter(Boolean)).size}
              </p>
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
                    (p) =>
                      p.updatedAt && Date.now() - p.updatedAt.getTime() < 7 * 24 * 60 * 60 * 1000
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
