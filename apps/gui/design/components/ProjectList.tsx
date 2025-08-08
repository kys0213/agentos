import { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DynamicFormRenderer } from "./DynamicFormRenderer";
import { 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Play,
  Settings,
  Bot,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  BookOpen,
  FileText,
  Database,
  TrendingUp,
  BarChart3,
  Folder,
  FolderOpen,
  Archive,
  ExternalLink
} from "lucide-react";

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
  status: "active" | "draft";
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

interface ProjectListProps {
  onSelectProject: (project: Preset) => void;
}

export function ProjectList({ onSelectProject }: ProjectListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize mock data with project-focused structure
  useEffect(() => {
    setTimeout(() => {
      const mockPresets: Preset[] = [
        {
          id: "project-research-001",
          name: "Research Assistant",
          description: "Specialized in gathering, analyzing, and synthesizing information from various sources",
          category: "research",
          model: "gpt-4",
          systemPrompt: "You are a research assistant that helps users find and analyze information...",
          parameters: {
            temperature: 0.7,
            maxTokens: 2048,
            topP: 0.9
          },
          tools: ["web-search", "database-query", "file-processor"],
          status: "active",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1),
          usageCount: 342,
          knowledgeDocuments: 15,
          knowledgeStats: {
            indexed: 12,
            vectorized: 8,
            totalSize: 45600
          }
        },
        {
          id: "project-code-002",
          name: "Code Assistant",
          description: "Expert in software development, debugging, and code optimization",
          category: "development",
          model: "gpt-4",
          systemPrompt: "You are a programming expert that helps with code development...",
          parameters: {
            temperature: 0.3,
            maxTokens: 4096,
            topP: 0.8
          },
          tools: ["code-executor", "file-processor"],
          status: "active",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          usageCount: 189,
          knowledgeDocuments: 8,
          knowledgeStats: {
            indexed: 8,
            vectorized: 6,
            totalSize: 23400
          }
        },
        {
          id: "project-content-003",
          name: "Content Writer",
          description: "Creative writing specialist for marketing, articles, and documentation",
          category: "creative",
          model: "gpt-3.5-turbo",
          systemPrompt: "You are a professional content writer...",
          parameters: {
            temperature: 0.9,
            maxTokens: 2048,
            topP: 0.95
          },
          tools: ["image-generator", "web-search"],
          status: "active",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 21),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          usageCount: 267,
          knowledgeDocuments: 22,
          knowledgeStats: {
            indexed: 18,
            vectorized: 14,
            totalSize: 67800
          }
        },
        {
          id: "project-analytics-004",
          name: "Data Analyzer",
          description: "Specialized in data analysis, visualization, and insights",
          category: "analytics",
          model: "gpt-4",
          systemPrompt: "You are a data analysis expert...",
          parameters: {
            temperature: 0.2,
            maxTokens: 3072,
            topP: 0.7
          },
          tools: ["database-query", "analytics-api"],
          status: "draft",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12),
          usageCount: 0,
          knowledgeDocuments: 5,
          knowledgeStats: {
            indexed: 3,
            vectorized: 2,
            totalSize: 12300
          }
        }
      ];
      
      setPresets(mockPresets);
      setIsLoading(false);
    }, 800);
  }, []);

  const categories = [
    { id: "all", label: "All Projects", count: presets.length },
    { id: "research", label: "Research", count: presets.filter(p => p.category === "research").length },
    { id: "development", label: "Development", count: presets.filter(p => p.category === "development").length },
    { id: "creative", label: "Creative", count: presets.filter(p => p.category === "creative").length },
    { id: "analytics", label: "Analytics", count: presets.filter(p => p.category === "analytics").length },
  ];

  const filteredPresets = presets.filter(preset => {
    const matchesSearch = preset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         preset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "research": return <Search className="w-4 h-4" />;
      case "development": return <Bot className="w-4 h-4" />;
      case "creative": return <Zap className="w-4 h-4" />;
      case "analytics": return <Database className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      draft: "secondary",
      archived: "outline"
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status === "active" && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === "draft" && <Clock className="w-3 h-3 mr-1" />}
        {status === "archived" && <Archive className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const duplicatePreset = (preset: Preset) => {
    const duplicated: Preset = {
      ...preset,
      id: `project-${preset.category}-${Date.now()}`,
      name: `${preset.name} (Copy)`,
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      usageCount: 0,
      knowledgeDocuments: 0,
      knowledgeStats: {
        indexed: 0,
        vectorized: 0,
        totalSize: 0
      }
    };
    setPresets(prev => [...prev, duplicated]);
  };

  const deletePreset = (presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  };

  // Calculate aggregated stats
  const totalKnowledgeDocs = presets.reduce((sum, p) => sum + p.knowledgeDocuments, 0);
  const totalIndexedDocs = presets.reduce((sum, p) => sum + (p.knowledgeStats?.indexed || 0), 0);
  const totalVectorizedDocs = presets.reduce((sum, p) => sum + (p.knowledgeStats?.vectorized || 0), 0);
  const totalProjects = presets.length;
  const activeProjects = presets.filter(p => p.status === 'active').length;
  const avgDocsPerProject = presets.length > 0 ? (totalKnowledgeDocs / presets.length).toFixed(1) : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold text-foreground mb-2">Agent Projects</h1>
            <p className="text-muted-foreground">
              Create and manage isolated AI agent projects with dedicated knowledge bases
            </p>
          </div>
          <Button onClick={() => setCreateWizardOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Create Project
          </Button>
        </div>

        {/* Project Overview Stats */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Folder className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalProjects}</p>
                <p className="text-sm text-muted-foreground">Total Projects</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{activeProjects}</p>
                <p className="text-sm text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalKnowledgeDocs}</p>
                <p className="text-sm text-muted-foreground">Knowledge Docs</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalVectorizedDocs}</p>
                <p className="text-sm text-muted-foreground">Vectorized</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{avgDocsPerProject}</p>
                <p className="text-sm text-muted-foreground">Avg Docs/Project</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Project Isolation Summary */}
        <Card className="p-4">
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
                  Independent Processing: {totalKnowledgeDocs > 0 ? ((totalIndexedDocs / totalKnowledgeDocs) * 100).toFixed(0) : 0}% indexed
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
      <div className="flex-1 min-h-0 p-6">
        <div className="space-y-6 h-full flex flex-col">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <div className="flex gap-1">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-1"
                >
                  {category.label}
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Project Grid */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-4">
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </Card>
                  ))
                ) : (
                  filteredPresets.map((preset) => (
                    <Card key={preset.id} className="p-6 hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getCategoryIcon(preset.category)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{preset.name}</h3>
                            <p className="text-sm text-muted-foreground capitalize">
                              {preset.category} project
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(preset.status)}
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-6 line-clamp-2">{preset.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Model:</span>
                            <span className="font-medium text-foreground">{preset.model}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Usage:</span>
                            <span className="font-medium text-foreground">{preset.usageCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tools:</span>
                            <span className="font-medium text-foreground">{preset.tools.length}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Knowledge:</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <BookOpen className="w-3 h-3" />
                              {preset.knowledgeDocuments}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Indexed:</span>
                            <span className="font-medium text-foreground">
                              {preset.knowledgeStats?.indexed || 0}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vectorized:</span>
                            <span className="font-medium text-foreground">
                              {preset.knowledgeStats?.vectorized || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Knowledge Status Indicators */}
                      {preset.knowledgeStats && preset.knowledgeDocuments > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Search className="w-3 h-3" />
                            {preset.knowledgeStats.indexed}/{preset.knowledgeDocuments} Indexed
                          </Badge>
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Database className="w-3 h-3" />
                            {preset.knowledgeStats.vectorized}/{preset.knowledgeDocuments} Vector
                          </Badge>
                          <Badge variant="outline" className="text-xs gap-1">
                            <Folder className="w-3 h-3" />
                            Isolated
                          </Badge>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-2"
                          onClick={() => onSelectProject(preset)}
                        >
                          <ExternalLink className="w-3 h-3" />
                          Open Project
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => duplicatePreset(preset)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deletePreset(preset.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Create Wizard Dialog */}
      <Dialog open={createWizardOpen} onOpenChange={setCreateWizardOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Agent Project</DialogTitle>
          </DialogHeader>
          <DynamicFormRenderer 
            isCreateMode={true}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            onComplete={() => setCreateWizardOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}