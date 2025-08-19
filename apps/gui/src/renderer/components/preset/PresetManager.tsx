import type { CreatePreset, Preset, PresetStatus } from '@agentos/core';
import {
  Archive,
  BarChart3,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  Folder,
  FolderOpen,
  Database,
  Plus,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { PrestForm } from './PresetForm';
import { PresetCreate } from './PresetCreate';
import { PresetDetail } from './PresetDetail';
import PresetCard from './PresetCard';
import PresetListFilters, { PresetCategoryOption } from './PresetListFilters';
import { Badge } from '../ui/badge';

export interface PresetManagerProps {
  presets?: Preset[];
  isLoading?: boolean;
  onDeletePreset?: (presetId: string) => void;
  onDuplicatePreset?: (preset: Preset) => void;
  onCreatePreset?: (data: Partial<Preset>) => void;
  onUpdatePreset?: (id: string, data: Partial<Preset>) => void;
  onCreatePresetAsync?: (data: CreatePreset) => Promise<Preset>;
  onStartCreatePreset?: () => void; // when provided, prefer global full-screen create mode
}

export function PresetManager({
  presets: injectedPresets,
  isLoading: injectedLoading,
  onDeletePreset,
  onDuplicatePreset,
  onCreatePreset,
  onUpdatePreset,
  onCreatePresetAsync,
  onStartCreatePreset,
}: PresetManagerProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [viewMode, setViewMode] = useState<'list' | 'detail' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Removed create wizard modal state
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sourcePresets = injectedPresets ?? presets;
  const loading = injectedLoading ?? isLoading;

  const categories: PresetCategoryOption[] = [
    { id: 'all', label: 'All Projects', count: sourcePresets.length },
    {
      id: 'research',
      label: 'Research',
      count: sourcePresets.filter((p) =>
        (Array.isArray(p.category) ? p.category : []).includes('research')
      ).length,
    },
    {
      id: 'development',
      label: 'Development',
      count: sourcePresets.filter((p) =>
        (Array.isArray(p.category) ? p.category : []).includes('development')
      ).length,
    },
    {
      id: 'creative',
      label: 'Creative',
      count: sourcePresets.filter((p) =>
        (Array.isArray(p.category) ? p.category : []).includes('creative')
      ).length,
    },
    {
      id: 'analytics',
      label: 'Analytics',
      count: sourcePresets.filter((p) =>
        (Array.isArray(p.category) ? p.category : []).includes('analytics')
      ).length,
    },
  ];

  const filteredPresets = sourcePresets.filter((preset) => {
    const matchesSearch =
      (preset.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (preset.description ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const cats = Array.isArray(preset.category) ? preset.category : [];
    const matchesCategory = selectedCategory === 'all' || cats.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const handleEditPreset = (preset: Preset) => {
    setSelectedPreset(preset);
    setEditDialogOpen(true);
  };

  const handleOpenDetail = (preset: Preset) => {
    setSelectedPreset(preset);
    setViewMode('detail');
  };

  const duplicatePreset = (preset: Preset) => {
    if (onDuplicatePreset) return onDuplicatePreset(preset);
    setPresets((prev) => [...prev, preset]);
  };

  const deletePresetLocal = (presetId: string) => {
    if (onDeletePreset) return onDeletePreset(presetId);
    setPresets((prev) => prev.filter((p) => p.id !== presetId));
  };

  // Calculate aggregated stats
  const totalKnowledgeDocs = sourcePresets.reduce((sum, p) => sum + (p.knowledgeDocuments ?? 0), 0);
  const totalIndexedDocs = sourcePresets.reduce(
    (sum, p) => sum + (p.knowledgeStats?.indexed || 0),
    0
  );
  const totalVectorizedDocs = sourcePresets.reduce(
    (sum, p) => sum + (p.knowledgeStats?.vectorized || 0),
    0
  );
  const totalProjects = sourcePresets.length;
  const activeProjects = sourcePresets.filter((p) => p.status === 'active').length;
  const avgDocsPerProject =
    sourcePresets.length > 0 ? (totalKnowledgeDocs / sourcePresets.length).toFixed(1) : 0;

  // If in detail view, render PresetDetail and return
  if (viewMode === 'detail' && selectedPreset) {
    return (
      <PresetDetail
        preset={selectedPreset}
        onBack={() => setViewMode('list')}
        onUpdate={(p) => onUpdatePreset?.(p.id, p)}
        onDelete={(id) => {
          onDeletePreset?.(id);
          setViewMode('list');
        }}
      />
    );
  }

  // Full-screen create funnel
  if (viewMode === 'create') {
    return (
      <PresetCreate
        onBack={() => setViewMode('list')}
        onCreate={async (data) => {
          if (onCreatePresetAsync) {
            const created = await onCreatePresetAsync(data);
            setViewMode('list');
            return created;
          }
          onCreatePreset?.(data as unknown as Partial<Preset>);
          setViewMode('list');
          return { ...(data as unknown as Preset) } as Preset;
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Agent Projects</h1>
            <p className="text-muted-foreground">
              Create and manage isolated AI agent projects with dedicated knowledge bases
            </p>
          </div>
          <Button
            onClick={() => (onStartCreatePreset ? onStartCreatePreset() : setViewMode('create'))}
            className="gap-2"
            data-testid="btn-create-project"
          >
            <Plus className="w-4 h-4" />
            Create Preset
          </Button>
        </div>

        {/* Project Overview Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Folder className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalProjects}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{activeProjects}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalKnowledgeDocs}</p>
                <p className="text-sm text-muted-foreground">Knowledge Docs</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalVectorizedDocs}</p>
                <p className="text-sm text-muted-foreground">Vectorized</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{avgDocsPerProject}</p>
                <p className="text-sm text-muted-foreground">Avg Docs/Project</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Project Isolation Summary */}
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-muted-foreground">
                  Isolated Storage: Each project maintains separate knowledge base
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">
                  Independent Processing:{' '}
                  {totalKnowledgeDocs > 0
                    ? ((totalIndexedDocs / totalKnowledgeDocs) * 100).toFixed(0)
                    : 0}
                  % indexed
                </span>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <Folder className="w-3 h-3" />
              Project-Based Architecture
            </Badge>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList>
              <TabsTrigger value="list">Project List</TabsTrigger>
              <TabsTrigger value="edit">Edit Project</TabsTrigger>
              <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="list" className="h-full">
              <div className="space-y-4 h-full flex flex-col">
                {/* Filters */}
                <PresetListFilters
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                />

                {/* Project Grid */}
                <div className="flex-1 min-h-0">
                  <ScrollArea className="h-full">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                      {loading
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="p-6">
                              <div className="animate-pulse space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-full"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                              </div>
                            </Card>
                          ))
                        : filteredPresets.map((preset) => (
                            <PresetCard
                              key={preset.id}
                              preset={preset}
                              onOpenDetail={handleOpenDetail}
                              onEdit={handleEditPreset}
                              onDuplicate={duplicatePreset}
                              onDelete={deletePresetLocal}
                            />
                          ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="edit" className="h-full">
              {selectedPreset ? (
                <PrestForm
                  preset={selectedPreset}
                  onSubmit={(data) => selectedPreset && onUpdatePreset?.(selectedPreset.id, data)}
                />
              ) : (
                <Card className="p-6 h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <Settings className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a project from the list to edit</p>
                    <p className="text-sm mt-2">Configure project settings and parameters</p>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="knowledge" className="h-full">
              {selectedPreset ? (
                <KnowledgeBaseManager
                  agentId={selectedPreset.id}
                  agentName={selectedPreset.name}
                  agentCategory={selectedPreset.category[0]}
                />
              ) : (
                <Card className="p-6 h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <BookOpen className="w-12 h-12 mx-auto mb-4" />
                    <p>Select a project to manage its knowledge base</p>
                    <p className="text-sm mt-2">Each project has an isolated knowledge space</p>
                  </div>
                </Card>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Create funnel moved to full-screen view (no modal) */}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Edit Project: {selectedPreset?.name}</DialogTitle>
          </DialogHeader>
          {selectedPreset && (
            <PrestForm preset={selectedPreset} onComplete={() => setEditDialogOpen(false)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
