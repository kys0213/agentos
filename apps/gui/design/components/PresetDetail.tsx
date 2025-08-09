import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from './ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  Trash2,
  Brain,
  Database,
  Code,
  BarChart3,
  Users,
  Calendar,
  Zap,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
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

interface PresetDetailProps {
  preset: Preset;
  onBack: () => void;
  onUpdate: (preset: Preset) => void;
  onDelete: (presetId: string) => void;
}

export function PresetDetail({ preset, onBack, onUpdate, onDelete }: PresetDetailProps) {
  const [editedPreset, setEditedPreset] = useState<Preset>(preset);
  const [activeTab, setActiveTab] = useState('overview');
  const [hasChanges, setHasChanges] = useState(false);

  const updatePreset = (updates: Partial<Preset>) => {
    setEditedPreset((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate(editedPreset);
    setHasChanges(false);
  };

  const handleDelete = () => {
    onDelete(preset.id);
    onBack();
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'research':
        return <Database className="w-5 h-5" />;
      case 'development':
        return <Code className="w-5 h-5" />;
      case 'creative':
        return <FileText className="w-5 h-5" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="gap-1 status-active">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        );
      case 'idle':
        return (
          <Badge className="gap-1 status-idle">
            <Clock className="w-3 h-3" />
            Idle
          </Badge>
        );
      case 'inactive':
        return (
          <Badge variant="outline" className="gap-1 status-inactive-subtle">
            <AlertCircle className="w-3 h-3" />
            Inactive
          </Badge>
        );
      default:
        return null;
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
              Back to Presets
            </Button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                <div className="text-blue-600">{getCategoryIcon(editedPreset.category)}</div>
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">{editedPreset.name}</h1>
                <p className="text-muted-foreground capitalize">{editedPreset.category} preset</p>
              </div>
              {getStatusBadge(editedPreset.status)}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && <span className="text-sm text-orange-600 mr-2">Unsaved changes</span>}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Preset</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{preset.name}"? This action cannot be undone.
                    Any agents using this preset will need to be reassigned.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete Preset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{editedPreset.usageCount}</p>
                <p className="text-xs text-muted-foreground">Total Uses</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {editedPreset.knowledgeDocuments}
                </p>
                <p className="text-xs text-muted-foreground">Knowledge Docs</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <Brain className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{editedPreset.model}</p>
                <p className="text-xs text-muted-foreground">Model</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{editedPreset.tools.length}</p>
                <p className="text-xs text-muted-foreground">Tools</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                <Calendar className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">
                  {editedPreset.updatedAt.toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">Last Updated</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0">
            <TabsContent value="overview" className="h-full">
              <div className="grid grid-cols-2 gap-6 h-full">
                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">
                      Basic Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Preset Name</Label>
                        <Input
                          id="name"
                          value={editedPreset.name}
                          onChange={(e) => updatePreset({ name: e.target.value })}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={editedPreset.description}
                          onChange={(e) => updatePreset({ description: e.target.value })}
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select
                            value={editedPreset.category}
                            onValueChange={(value) => updatePreset({ category: value })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="research">Research</SelectItem>
                              <SelectItem value="development">Development</SelectItem>
                              <SelectItem value="creative">Creative</SelectItem>
                              <SelectItem value="analytics">Analytics</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={editedPreset.status}
                            onValueChange={(value: 'active' | 'idle' | 'inactive') =>
                              updatePreset({ status: value })
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="idle">Idle</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Model Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="model">Model</Label>
                        <Select
                          value={editedPreset.model}
                          onValueChange={(value) => updatePreset({ model: value })}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                            <SelectItem value="claude-3-5-sonnet">Claude 3.5 Sonnet</SelectItem>
                            <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                            <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Temperature: {editedPreset.parameters.temperature}</Label>
                        <Slider
                          value={[editedPreset.parameters.temperature]}
                          onValueChange={([value]) =>
                            updatePreset({
                              parameters: { ...editedPreset.parameters, temperature: value },
                            })
                          }
                          max={1}
                          min={0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Max Tokens: {editedPreset.parameters.maxTokens}</Label>
                        <Slider
                          value={[editedPreset.parameters.maxTokens]}
                          onValueChange={([value]) =>
                            updatePreset({
                              parameters: { ...editedPreset.parameters, maxTokens: value },
                            })
                          }
                          max={8000}
                          min={100}
                          step={100}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Top P: {editedPreset.parameters.topP}</Label>
                        <Slider
                          value={[editedPreset.parameters.topP]}
                          onValueChange={([value]) =>
                            updatePreset({
                              parameters: { ...editedPreset.parameters, topP: value },
                            })
                          }
                          max={1}
                          min={0}
                          step={0.1}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">System Prompt</h3>
                    <Textarea
                      value={editedPreset.systemPrompt}
                      onChange={(e) => updatePreset({ systemPrompt: e.target.value })}
                      className="min-h-[200px] font-mono text-sm"
                      placeholder="Enter the system prompt for this preset..."
                    />
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Available Tools</h3>
                    <div className="flex flex-wrap gap-2">
                      {editedPreset.tools.map((tool, index) => (
                        <Badge key={index} variant="outline" className="px-3 py-1">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                      Manage Tools
                    </Button>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="configuration" className="h-full">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Advanced Configuration
                </h3>
                <p className="text-muted-foreground">
                  Advanced preset configuration options coming soon...
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="knowledge" className="h-full">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Knowledge Base</h3>
                <p className="text-muted-foreground">
                  Knowledge base management for this preset...
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="usage" className="h-full">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Usage Analytics</h3>
                <p className="text-muted-foreground">
                  Usage analytics and statistics for this preset...
                </p>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
