import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { KnowledgeBaseManager } from './KnowledgeBaseManager';
import { DynamicFormRenderer } from './DynamicFormRenderer';
import {
  ArrowLeft,
  Settings,
  BookOpen,
  BarChart3,
  Users,
  Folder,
  Database,
  CheckCircle,
  FileText,
  Search,
  Clock,
  Zap,
  Bot,
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
  status: 'active' | 'draft';
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

interface ProjectDetailProps {
  project: Preset;
  onBack: () => void;
}

export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('knowledge');

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Search className="w-5 h-5" />;
      case 'development':
        return <Bot className="w-5 h-5" />;
      case 'creative':
        return <Zap className="w-5 h-5" />;
      case 'analytics':
        return <Database className="w-5 h-5" />;
      default:
        return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'default',
      draft: 'secondary',
      archived: 'outline',
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status === 'active' && <CheckCircle className="w-3 h-3 mr-1" />}
        {status === 'draft' && <Clock className="w-3 h-3 mr-1" />}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Project Header */}
      <div className="flex-shrink-0 border-b bg-white">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={onBack} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
              <div className="w-px h-6 bg-border"></div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  {getCategoryIcon(project.category)}
                </div>
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{project.name}</h1>
                  <p className="text-muted-foreground capitalize">
                    {project.category} project • {project.model}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(project.status)}
              <Badge variant="outline" className="gap-1">
                <Folder className="w-3 h-3" />
                Project ID: {project.id.split('-').pop()}
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground max-w-2xl">{project.description}</p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{project.knowledgeDocuments} documents</span>
              </div>
              <div className="flex items-center gap-1">
                <Database className="w-4 h-4" />
                <span>{project.knowledgeStats?.vectorized || 0} vectorized</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{project.usageCount} conversations</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Updated {project.updatedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Quick Stats */}
        <div className="px-6 pb-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {project.knowledgeDocuments}
                  </p>
                  <p className="text-sm text-muted-foreground">Knowledge Docs</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {project.knowledgeStats?.indexed || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Indexed</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Database className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {project.knowledgeStats?.vectorized || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Vectorized</p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xl font-semibold text-foreground">
                    {project.knowledgeStats?.totalSize
                      ? (project.knowledgeStats.totalSize / 1024).toFixed(1)
                      : 0}
                    KB
                  </p>
                  <p className="text-sm text-muted-foreground">Storage Used</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Project Isolation Status */}
        <div className="px-6 pb-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Isolated workspace with dedicated storage and processing
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">
                    Independent embeddings and BM25 index
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="gap-1">
                <Folder className="w-3 h-3" />
                Project Workspace
              </Badge>
            </div>
          </Card>
        </div>
      </div>

      {/* Project Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="knowledge" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="w-4 h-4" />
                Project Settings
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0">
            <TabsContent value="knowledge" className="h-full m-0">
              <KnowledgeBaseManager
                agentId={project.id}
                agentName={project.name}
                agentCategory={project.category}
              />
            </TabsContent>

            <TabsContent value="settings" className="h-full m-0 p-6">
              <DynamicFormRenderer preset={project} />
            </TabsContent>

            <TabsContent value="analytics" className="h-full m-0 p-6">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Project Analytics</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-3">Usage Statistics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">
                            Total Conversations:
                          </span>
                          <span className="font-medium">{project.usageCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg Session Length:</span>
                          <span className="font-medium">12.3 minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Knowledge Queries:</span>
                          <span className="font-medium">
                            {Math.floor(project.usageCount * 2.3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Success Rate:</span>
                          <span className="font-medium text-green-600">94.2%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-3">Knowledge Performance</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Index Coverage:</span>
                          <span className="font-medium">
                            {project.knowledgeDocuments > 0
                              ? (
                                  ((project.knowledgeStats?.indexed || 0) /
                                    project.knowledgeDocuments) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Vector Coverage:</span>
                          <span className="font-medium">
                            {project.knowledgeDocuments > 0
                              ? (
                                  ((project.knowledgeStats?.vectorized || 0) /
                                    project.knowledgeDocuments) *
                                  100
                                ).toFixed(0)
                              : 0}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Avg Query Time:</span>
                          <span className="font-medium">142ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Cache Hit Rate:</span>
                          <span className="font-medium text-green-600">87.1%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Project Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Project Created</p>
                        <p className="text-xs text-muted-foreground">
                          {project.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Knowledge Base Initialized</p>
                        <p className="text-xs text-muted-foreground">
                          {project.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Last Activity</p>
                        <p className="text-xs text-muted-foreground">
                          {project.updatedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
