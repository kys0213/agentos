import {
  BookOpen,
  CheckCircle,
  Copy,
  Database,
  Download,
  Edit,
  FileStack,
  FileText,
  Folder,
  Layout,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ServiceContainer } from '../../../shared/di/service-container';
import { Textarea } from '../ui/textarea';

interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  filename?: string;
  size: number;
  type: 'markdown' | 'text';
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  chunks?: DocumentChunk[];
  indexed: boolean;
  vectorized: boolean;
  agentId: string;
  agentName: string;
  isTemplate?: boolean; // Indicates if it's from a template
}

interface DocumentChunk {
  id: string;
  content: string;
  index: number;
  tokens: number;
  embedding?: number[];
}

interface KnowledgeBaseManagerProps {
  agentId?: string;
  agentName?: string;
  agentCategory?: string;
}

interface PresetKnowledgeStats {
  totalDocuments: number;
  indexedDocuments: number;
  vectorizedDocuments: number;
  totalChunks: number;
  lastUpdated: Date;
  storageSize: number; // in bytes
}

interface KnowledgeTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  documents: Array<{
    title: string;
    content: string;
    tags: string[];
  }>;
}

// (Note) Stored document guards removed; not used currently.

export function KnowledgeBaseManager({
  agentId,
  agentName,
  agentCategory,
}: KnowledgeBaseManagerProps) {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexingProgress, setIndexingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('documents');
  const [newDocumentDialog, setNewDocumentDialog] = useState(false);
  const [templateDialog, setTemplateDialog] = useState(false);
  const [newDocumentTitle, setNewDocumentTitle] = useState('');
  const [newDocumentContent, setNewDocumentContent] = useState('');
  const [newDocumentTags, setNewDocumentTags] = useState('');
  const [availableTemplates, setAvailableTemplates] = useState<KnowledgeTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [knowledgeStats, setKnowledgeStats] = useState<PresetKnowledgeStats | null>(null);
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; title: string; updatedAt: Date; tags: string[] }>
  >([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const knowledge = ServiceContainer.get('knowledge');

  const handleSelectDocument = useCallback(
    async (doc: KnowledgeDocument) => {
      setSelectedDocument(doc);
      if (!agentId || !knowledge) {
        return;
      }
      if (doc.content && doc.content.length > 0) {
        return;
      }
      try {
        const detail = await knowledge.readDoc(agentId, doc.id);

        const enriched: KnowledgeDocument = {
          ...doc,
          content: detail.content,
          updatedAt: new Date(detail.updatedAt),
          // keep existing tags if response omitted
          tags: Array.isArray(detail.tags) ? detail.tags : doc.tags,
        };
        setSelectedDocument(enriched);
        // update list entry so subsequent selects don’t refetch
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === doc.id
              ? {
                  ...d,
                  content: enriched.content,
                  updatedAt: enriched.updatedAt,
                  tags: enriched.tags,
                }
              : d
          )
        );
      } catch (err) {
        console.error('Failed to read document content', err);
      }
    },
    [agentId, knowledge]
  );

  // Initial load from Core and templates
  useEffect(() => {
    if (!agentId) {
      return;
    }
    (async () => {
      try {
        if (knowledge) {
          const page = await knowledge.listDocs(agentId, { limit: 100 });

          const next: KnowledgeDocument[] = page.items.map((d) => ({
            id: d.id,
            title: d.title,
            content: '',
            filename: undefined,
            size: 0,
            type: 'markdown',
            createdAt: new Date(d.updatedAt),
            updatedAt: new Date(d.updatedAt),
            tags: d.tags ?? [],
            chunks: [],
            indexed: false,
            vectorized: false,
            agentId: agentId ?? '',
            agentName: agentName ?? '',
            isTemplate: false,
          }));

          setDocuments(next);
        } else {
          initializeWithStarterContent();
        }
      } finally {
        loadAvailableTemplates();
        calculateKnowledgeStats();
      }
    })();
  }, [agentId]);

  // Recompute stats when documents change
  useEffect(() => {
    if (agentId) {
      calculateKnowledgeStats();
    }
  }, [documents, agentId]);

  const loadAvailableTemplates = () => {
    // Predefined knowledge templates for different categories
    const templates: KnowledgeTemplate[] = [
      {
        id: 'global-guidelines',
        name: 'Company Guidelines',
        description: 'Standard company policies and guidelines',
        category: 'global',
        documents: [
          {
            title: 'Company Code of Conduct',
            content:
              '# Company Code of Conduct\n\n## Professional Standards\n- Maintain professional behavior at all times\n- Respect diversity and inclusion\n- Follow data privacy regulations\n\n## Communication Guidelines\n- Use clear and concise language\n- Be respectful in all interactions\n- Follow proper escalation procedures',
            tags: ['company', 'guidelines', 'conduct'],
          },
          {
            title: 'Brand Voice Guidelines',
            content:
              '# Brand Voice Guidelines\n\n## Tone\n- Professional yet approachable\n- Clear and helpful\n- Empathetic and understanding\n\n## Language Style\n- Use active voice\n- Avoid jargon\n- Be concise but comprehensive',
            tags: ['brand', 'voice', 'communication'],
          },
        ],
      },
      {
        id: 'research-starter',
        name: 'Research Assistant Starter',
        description: 'Research methodologies and best practices',
        category: 'research',
        documents: [
          {
            title: 'Research Methodology Guidelines',
            content:
              '# Research Methodology Guidelines\n\n## Primary Research\n- Define clear research objectives\n- Choose appropriate methodologies\n- Ensure data quality and reliability\n\n## Secondary Research\n- Use credible sources\n- Cross-reference information\n- Cite sources properly\n\n## Data Analysis\n- Apply statistical methods appropriately\n- Identify patterns and trends\n- Draw evidence-based conclusions',
            tags: ['research', 'methodology', 'analysis'],
          },
          {
            title: 'Source Evaluation Criteria',
            content:
              '# Source Evaluation Criteria\n\n## Credibility Factors\n- Author expertise and credentials\n- Publication reputation\n- Peer review status\n- Currency and relevance\n\n## Red Flags\n- Biased or promotional content\n- Lack of citations\n- Outdated information\n- Unverifiable claims',
            tags: ['sources', 'evaluation', 'credibility'],
          },
        ],
      },
      {
        id: 'development-starter',
        name: 'Development Assistant Starter',
        description: 'Coding standards and development practices',
        category: 'development',
        documents: [
          {
            title: 'Coding Standards',
            content:
              '# Coding Standards\n\n## General Principles\n- Write clean, readable code\n- Use meaningful variable names\n- Comment complex logic\n- Follow DRY principles\n\n## Code Review Guidelines\n- Review for functionality\n- Check for security vulnerabilities\n- Ensure performance optimization\n- Verify test coverage',
            tags: ['coding', 'standards', 'best-practices'],
          },
          {
            title: 'Development Workflow',
            content:
              '# Development Workflow\n\n## Git Best Practices\n- Use descriptive commit messages\n- Create feature branches\n- Perform regular code reviews\n- Maintain clean history\n\n## Testing Strategy\n- Write unit tests\n- Implement integration tests\n- Perform user acceptance testing\n- Automate testing processes',
            tags: ['workflow', 'git', 'testing'],
          },
        ],
      },
      {
        id: 'creative-starter',
        name: 'Creative Assistant Starter',
        description: 'Content creation and writing guidelines',
        category: 'creative',
        documents: [
          {
            title: 'Content Creation Guidelines',
            content:
              '# Content Creation Guidelines\n\n## Writing Style\n- Engage your audience\n- Use compelling headlines\n- Tell stories that resonate\n- Include clear calls to action\n\n## Content Types\n- Blog posts and articles\n- Social media content\n- Marketing materials\n- Documentation',
            tags: ['content', 'writing', 'creativity'],
          },
          {
            title: 'SEO Best Practices',
            content:
              '# SEO Best Practices\n\n## Keyword Strategy\n- Research relevant keywords\n- Use keywords naturally\n- Focus on long-tail keywords\n- Monitor keyword performance\n\n## Content Optimization\n- Write compelling meta descriptions\n- Use proper heading structure\n- Optimize images with alt text\n- Create internal linking strategy',
            tags: ['seo', 'optimization', 'content'],
          },
        ],
      },
      {
        id: 'analytics-starter',
        name: 'Analytics Assistant Starter',
        description: 'Data analysis methodologies and tools',
        category: 'analytics',
        documents: [
          {
            title: 'Data Analysis Framework',
            content:
              '# Data Analysis Framework\n\n## Data Collection\n- Define metrics and KPIs\n- Ensure data quality\n- Implement proper tracking\n- Regular data validation\n\n## Analysis Methods\n- Descriptive analytics\n- Predictive modeling\n- Statistical significance testing\n- Trend analysis',
            tags: ['analytics', 'data', 'framework'],
          },
          {
            title: 'Visualization Guidelines',
            content:
              '# Data Visualization Guidelines\n\n## Chart Selection\n- Choose appropriate chart types\n- Consider your audience\n- Highlight key insights\n- Keep it simple and clear\n\n## Design Principles\n- Use consistent color schemes\n- Provide clear labels\n- Include context and legends\n- Avoid chart junk',
            tags: ['visualization', 'charts', 'design'],
          },
        ],
      },
    ];

    // Filter templates based on category or show all
    const relevantTemplates = templates.filter(
      (t) => t.category === 'global' || t.category === agentCategory
    );

    setAvailableTemplates(relevantTemplates);
  };

  const initializeWithStarterContent = () => {
    // For new projects, show welcome message but don't auto-add content
    const welcomeDoc: KnowledgeDocument = {
      id: `${agentId}-welcome`,
      title: `Welcome to ${agentName}`,
      content: `# Welcome to ${agentName}\n\nThis is your dedicated knowledge base for ${agentName}. This project is completely isolated and independent.\n\n## Getting Started\n\n1. **Upload Documents**: Drag and drop markdown files or use the upload button\n2. **Create Documents**: Use the "New Document" button to create content\n3. **Use Templates**: Apply starter templates for your category\n4. **Index & Vectorize**: Process documents for better search\n\n## Project Isolation\n\nThis knowledge base is specific to ${agentName} and doesn't share data with other agents. Each agent maintains its own independent project space, similar to Claude Desktop projects.\n\nStart building your knowledge base!`,
      size: 800,
      type: 'markdown',
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['welcome', 'getting-started'],
      indexed: false,
      vectorized: false,
      agentId: agentId!,
      agentName: agentName!,
      isTemplate: true,
    };

    setDocuments([welcomeDoc]);
  };

  const calculateKnowledgeStats = async () => {
    if (!agentId) {
      return;
    }
    try {
      if (knowledge) {
        const stats = await knowledge.getStats(agentId);

        setKnowledgeStats({
          totalDocuments: stats.totalDocuments,
          indexedDocuments: stats.totalChunks,
          vectorizedDocuments: 0,
          totalChunks: stats.totalChunks,
          lastUpdated: stats.lastUpdated ? new Date(stats.lastUpdated) : new Date(0),
          storageSize: stats.storageSize,
        });
        return;
      }
    } catch (e) {
      console.error('Failed to load stats', e);
    }
    // Fallback local calc
    if (documents.length) {
      setKnowledgeStats({
        totalDocuments: documents.length,
        indexedDocuments: documents.filter((d) => d.indexed).length,
        vectorizedDocuments: documents.filter((d) => d.vectorized).length,
        totalChunks: documents.reduce((sum, doc) => sum + (doc.chunks?.length || 0), 0),
        lastUpdated: new Date(Math.max(...documents.map((d) => d.updatedAt.getTime()))),
        storageSize: documents.reduce((sum, doc) => sum + doc.size, 0),
      });
    }
  };

  const handleFileUpload = useCallback(
    (files: FileList) => {
      setIsUploading(true);
      setUploadProgress(0);

      (async () => {
        const list = Array.from(files);
        for (let index = 0; index < list.length; index++) {
          const file = list[index];
          try {
            if (
              file.type === 'text/markdown' ||
              file.name.endsWith('.md') ||
              file.type === 'text/plain'
            ) {
              const content = await file.text();
              if (knowledge && agentId) {
                await knowledge.addDoc(agentId, {
                  title: file.name.replace(/\.(md|txt)$/, ''),
                  content,
                  tags: [],
                });
              }
            }
          } catch (e) {
            console.error('Upload failed for', file.name, e);
          } finally {
            setUploadProgress(((index + 1) / list.length) * 100);
          }
        }

        // Refresh list from Core after upload
        try {
          if (knowledge && agentId) {
            const page = await knowledge.listDocs(agentId, { limit: 100 });
            const next: KnowledgeDocument[] = page.items.map((d) => ({
              id: d.id,
              title: d.title,
              content: '',
              filename: undefined,
              size: 0,
              type: 'markdown',
              createdAt: new Date(d.updatedAt),
              updatedAt: new Date(d.updatedAt),
              tags: d.tags ?? [],
              chunks: [],
              indexed: false,
              vectorized: false,
              agentId: agentId ?? '',
              agentName: agentName ?? '',
              isTemplate: false,
            }));
            setDocuments(next);
          }
        } finally {
          setIsUploading(false);
          setUploadProgress(0);
          await calculateKnowledgeStats();
        }
      })();
    },
    [agentId, agentName, knowledge, calculateKnowledgeStats]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileUpload(files);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
  };

  const indexDocument = async (docId: string) => {
    setIsIndexing(true);
    setIndexingProgress(0);

    // Simulate indexing process
    for (let i = 0; i <= 100; i += 10) {
      setIndexingProgress(i);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, indexed: true, updatedAt: new Date() } : doc))
    );

    setIsIndexing(false);
    setIndexingProgress(0);
  };

  const vectorizeDocument = async (docId: string) => {
    const doc = documents.find((d) => d.id === docId);
    if (!doc) {
      return;
    }

    setIsIndexing(true);
    setIndexingProgress(0);

    // Simulate chunking and vectorization
    const chunks: DocumentChunk[] = [];
    const chunkSize = 1000;
    const content = doc.content;

    for (let i = 0; i < content.length; i += chunkSize) {
      const chunk: DocumentChunk = {
        id: `${docId}-chunk-${chunks.length}`,
        content: content.slice(i, i + chunkSize),
        index: chunks.length,
        tokens: Math.floor(chunkSize / 4), // Rough token estimate
        embedding: Array.from({ length: 1536 }, () => Math.random()), // Mock embedding
      };
      chunks.push(chunk);

      setIndexingProgress((i / content.length) * 100);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              chunks,
              vectorized: true,
              indexed: true,
              updatedAt: new Date(),
            }
          : d
      )
    );

    setIsIndexing(false);
    setIndexingProgress(0);
  };

  const createNewDocument = async () => {
    try {
      const tags = newDocumentTags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      if (knowledge && agentId) {
        await knowledge.addDoc(agentId, {
          title: newDocumentTitle,
          content: newDocumentContent,
          tags,
        });
        // Refresh from Core
        const page = await knowledge.listDocs(agentId, { limit: 100 });

        const next: KnowledgeDocument[] = page.items.map((d) => ({
          id: d.id,
          title: d.title,
          content: '',
          filename: undefined,
          size: 0,
          type: 'markdown',
          createdAt: new Date(d.updatedAt),
          updatedAt: new Date(d.updatedAt),
          tags: d.tags ?? [],
          chunks: [],
          indexed: false,
          vectorized: false,
          agentId: agentId ?? '',
          agentName: agentName ?? '',
          isTemplate: false,
        }));
        setDocuments(next);
        await calculateKnowledgeStats();
      } else {
        const newDoc: KnowledgeDocument = {
          id: `${agentId}-doc-${Date.now()}`,
          title: newDocumentTitle,
          content: newDocumentContent,
          size: newDocumentContent.length,
          type: 'markdown',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags,
          indexed: false,
          vectorized: false,
          agentId: agentId!,
          agentName: agentName!,
        };
        setDocuments((prev) => [...prev, newDoc]);
      }
    } catch (e) {
      console.error('Failed to create document', e);
    } finally {
      setNewDocumentDialog(false);
      setNewDocumentTitle('');
      setNewDocumentContent('');
      setNewDocumentTags('');
    }
  };

  const applyTemplate = () => {
    const template = availableTemplates.find((t) => t.id === selectedTemplate);
    if (!template) {
      return;
    }

    const templateDocs = template.documents.map((doc, index) => ({
      id: `${agentId}-template-${Date.now()}-${index}`,
      title: doc.title,
      content: doc.content,
      size: doc.content.length,
      type: 'markdown' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: doc.tags,
      indexed: false,
      vectorized: false,
      agentId: agentId!,
      agentName: agentName!,
      isTemplate: true,
    }));

    setDocuments((prev) => [...prev, ...templateDocs]);
    setTemplateDialog(false);
    setSelectedTemplate('');
  };

  const deleteDocument = async (docId: string) => {
    try {
      if (knowledge && agentId) {
        await knowledge.removeDoc(agentId, docId);
        // Refresh list from Core
        const page = await knowledge.listDocs(agentId, { limit: 100 });
        const next: KnowledgeDocument[] = page.items.map((d) => ({
          id: d.id,
          title: d.title,
          content: '',
          filename: undefined,
          size: 0,
          type: 'markdown',
          createdAt: new Date(d.updatedAt),
          updatedAt: new Date(d.updatedAt),
          tags: d.tags ?? [],
          chunks: [],
          indexed: false,
          vectorized: false,
          agentId: agentId ?? '',
          agentName: agentName ?? '',
          isTemplate: false,
        }));
        setDocuments(next);
      } else {
        // Fallback local behavior
        setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      }
    } catch (e) {
      console.error('Failed to delete document', e);
    } finally {
      if (selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
      await calculateKnowledgeStats();
    }
  };

  const searchDocuments = (query: string) => {
    if (!query.trim()) {
      return documents;
    }

    return documents.filter(
      (doc) =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.content.toLowerCase().includes(query.toLowerCase()) ||
        doc.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
    );
  };

  const filteredDocuments = searchDocuments(searchQuery);
  const totalDocuments = documents.length;
  const indexedDocuments = documents.filter((d) => d.indexed).length;
  const vectorizedDocuments = documents.filter((d) => d.vectorized).length;
  const templateDocuments = documents.filter((d) => d.isTemplate).length;

  if (!agentId) {
    return (
      <Card className="p-6 h-full flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-4" />
          <p>Select a preset to manage its knowledge base</p>
          <p className="text-sm mt-2">Each preset has its own isolated project space</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Knowledge Base Project</h2>
            <p className="text-muted-foreground">Independent knowledge space for {agentName}</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileStack className="w-4 h-4" />
                  Apply Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Apply Knowledge Template</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Available Templates</Label>
                    <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a template to apply" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTemplates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            <div className="flex items-center gap-2">
                              {template.category === 'global' && <Sparkles className="w-4 h-4" />}
                              {template.category !== 'global' && <Layout className="w-4 h-4" />}
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {template.documents.length} documents • {template.description}
                                </div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedTemplate && (
                    <div className="space-y-2">
                      <Label>Template Contents</Label>
                      <div className="border rounded-lg p-4 max-h-[200px] overflow-y-auto">
                        {availableTemplates
                          .find((t) => t.id === selectedTemplate)
                          ?.documents.map((doc, index) => (
                            <div key={index} className="flex items-center gap-2 py-1">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">{doc.title}</span>
                              <div className="flex gap-1 ml-auto">
                                {doc.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setTemplateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={applyTemplate} disabled={!selectedTemplate}>
                      Apply Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={newDocumentDialog} onOpenChange={setNewDocumentDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="w-4 h-4" />
                  New Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Document</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={newDocumentTitle}
                      onChange={(e) => setNewDocumentTitle(e.target.value)}
                      placeholder="Document title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea
                      value={newDocumentContent}
                      onChange={(e) => setNewDocumentContent(e.target.value)}
                      placeholder="Document content (Markdown supported)"
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tags</Label>
                    <Input
                      value={newDocumentTags}
                      onChange={(e) => setNewDocumentTags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setNewDocumentDialog(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={createNewDocument}
                      disabled={!newDocumentTitle || !newDocumentContent}
                    >
                      Create Document
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button size="sm" className="gap-2" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.txt,text/markdown,text/plain"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{totalDocuments}</p>
                <p className="text-sm text-muted-foreground">Total Documents</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Search className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{indexedDocuments}</p>
                <p className="text-sm text-muted-foreground">Indexed (BM25)</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{vectorizedDocuments}</p>
                <p className="text-sm text-muted-foreground">Vectorized</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileStack className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-semibold text-foreground">{templateDocuments}</p>
                <p className="text-sm text-muted-foreground">From Templates</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Project Status */}
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-muted-foreground">
                  Project: {agentName} ({agentCategory})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-muted-foreground">
                  Storage: {knowledgeStats ? (knowledgeStats.storageSize / 1024).toFixed(1) : 0}KB
                </span>
              </div>
            </div>
            <Badge variant="outline" className="gap-1">
              <CheckCircle className="w-3 h-3" />
              Isolated Project
            </Badge>
          </div>
        </Card>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="flex-shrink-0 px-6 pt-4">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="search">Search & Test</TabsTrigger>
              <TabsTrigger value="chunks">Chunks</TabsTrigger>
              <TabsTrigger value="project-info">Project Info</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 px-6 pb-6">
            <TabsContent value="documents" className="h-full">
              <div className="h-full flex gap-6">
                {/* Document List */}
                <div className="w-1/2 space-y-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {/* Upload Area */}
                  {isUploading && (
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-2">Uploading files...</div>
                      <Progress value={uploadProgress} />
                    </Card>
                  )}

                  {isIndexing && (
                    <Card className="p-4">
                      <div className="text-sm text-muted-foreground mb-2">
                        Processing document...
                      </div>
                      <Progress value={indexingProgress} />
                    </Card>
                  )}

                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center text-muted-foreground hover:border-primary/50 transition-colors"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2" />
                    <p>Drag & drop markdown files here</p>
                    <p className="text-sm">or click the Upload button</p>
                  </div>

                  {/* Document List */}
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {filteredDocuments.map((doc) => (
                        <Card
                          key={doc.id}
                          className={`p-4 cursor-pointer transition-colors ${
                            selectedDocument?.id === doc.id ? 'bg-accent' : 'hover:bg-accent/50'
                          }`}
                          onClick={() => handleSelectDocument(doc)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <FileText className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{doc.title}</span>
                                {doc.isTemplate && (
                                  <Badge variant="outline" className="text-xs gap-1">
                                    <FileStack className="w-3 h-3" />
                                    Template
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span>{(doc.size / 1024).toFixed(1)}KB</span>
                                <span>{doc.chunks?.length || 0} chunks</span>
                              </div>
                              <div className="flex items-center gap-1 mt-2">
                                {doc.indexed && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Search className="w-3 h-3" />
                                    Indexed
                                  </Badge>
                                )}
                                {doc.vectorized && (
                                  <Badge variant="secondary" className="text-xs gap-1">
                                    <Database className="w-3 h-3" />
                                    Vectorized
                                  </Badge>
                                )}
                              </div>
                              {doc.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {doc.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-1">
                              {!doc.indexed && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    indexDocument(doc.id);
                                  }}
                                  className="text-xs gap-1"
                                >
                                  <Search className="w-3 h-3" />
                                  Index
                                </Button>
                              )}
                              {!doc.vectorized && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    vectorizeDocument(doc.id);
                                  }}
                                  className="text-xs gap-1"
                                >
                                  <Database className="w-3 h-3" />
                                  Vectorize
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDocument(doc.id);
                                }}
                                className="text-xs text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                {/* Document Preview */}
                <div className="w-1/2">
                  {selectedDocument && (
                    <Card className="p-6 h-full">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-foreground">
                          {selectedDocument.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="gap-2">
                            <Edit className="w-3 h-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2">
                            <Download className="w-3 h-3" />
                            Export
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                        <div>Created: {selectedDocument.createdAt.toLocaleDateString()}</div>
                        <div>Updated: {selectedDocument.updatedAt.toLocaleDateString()}</div>
                        <div>Size: {(selectedDocument.size / 1024).toFixed(1)}KB</div>
                        {selectedDocument.chunks && (
                          <div>Chunks: {selectedDocument.chunks.length}</div>
                        )}
                        {selectedDocument.isTemplate && (
                          <div className="flex items-center gap-1">
                            <FileStack className="w-3 h-3" />
                            <span>Created from template</span>
                          </div>
                        )}
                      </div>

                      <ScrollArea className="h-[400px]">
                        <div className="whitespace-pre-wrap text-sm text-foreground">
                          {selectedDocument.content || '—'}
                        </div>
                      </ScrollArea>
                    </Card>
                  )}
                  {!selectedDocument && (
                    <Card className="p-6 h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4" />
                        <p>Select a document to preview</p>
                      </div>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="search" className="h-full">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Test Knowledge Search
                  </h3>
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter search query to test retrieval..."
                        className="flex-1"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <Select defaultValue="bm25">
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bm25">BM25</SelectItem>
                          <SelectItem value="vector">Vector</SelectItem>
                          <SelectItem value="hybrid">Hybrid</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        className="gap-2"
                        onClick={async () => {
                          if (!agentId || !knowledge || !searchQuery.trim()) {
                            setSearchResults([]);
                            return;
                          }
                          try {
                            const res = await knowledge.search(agentId, searchQuery, 20);

                            const items = res.items.map((d) => ({
                              id: d.id,
                              title: d.title,
                              updatedAt: new Date(d.updatedAt),
                              tags: Array.isArray(d.tags) ? d.tags : [],
                            }));
                            setSearchResults(items);
                          } catch (e) {
                            console.error('Search failed:', e);
                            setSearchResults([]);
                          }
                        }}
                      >
                        <Search className="w-4 h-4" />
                        Search
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      Test how your isolated project knowledge responds to different queries
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Search Results</h3>
                  {searchResults.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Search className="w-12 h-12 mx-auto mb-4" />
                      <p>Enter a search query above to see results</p>
                    </div>
                  )}
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      {searchResults.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between border rounded-md p-3"
                        >
                          <div>
                            <div className="font-medium">{r.title}</div>
                            <div className="text-xs text-muted-foreground">
                              Updated {r.updatedAt.toLocaleDateString()} • {r.tags.join(', ')}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const doc = documents.find((d) => d.id === r.id);
                              if (doc) {
                                void handleSelectDocument(doc);
                              }
                            }}
                          >
                            Open
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="chunks" className="h-full">
              <div className="space-y-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Document Chunks</h3>
                  <p className="text-muted-foreground mb-4">
                    View how documents are split into chunks for vector search in this project
                  </p>

                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {documents
                        .filter((doc) => doc.chunks?.length)
                        .map((doc) => (
                          <div key={doc.id} className="border rounded-lg p-4">
                            <h4 className="font-medium text-foreground mb-2">{doc.title}</h4>
                            <div className="space-y-2">
                              {doc.chunks?.map((chunk) => (
                                <div key={chunk.id} className="bg-gray-50 rounded p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-muted-foreground">
                                      Chunk {chunk.index + 1} • {chunk.tokens} tokens
                                    </span>
                                    <Button size="sm" variant="ghost" className="gap-1 text-xs">
                                      <Copy className="w-3 h-3" />
                                      Copy
                                    </Button>
                                  </div>
                                  <div className="text-sm text-foreground">
                                    {chunk.content.substring(0, 200)}
                                    {chunk.content.length > 200 && '...'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="project-info" className="h-full">
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Project Details</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Project Name:</span>
                          <span className="font-medium">{agentName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Category:</span>
                          <span className="font-medium capitalize">{agentCategory}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Project ID:</span>
                          <span className="font-medium text-xs">{agentId}</span>
                        </div>
                        {/* Storage details omitted after Core integration */}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-foreground mb-2">Isolation Status</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Completely isolated storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Independent embeddings</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>Separate BM25 index</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span>No cross-project sharing</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">
                    Available Templates
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {availableTemplates.map((template) => (
                      <div key={template.id} className="border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {template.category === 'global' && (
                            <Sparkles className="w-4 h-4 text-yellow-600" />
                          )}
                          {template.category !== 'global' && (
                            <Layout className="w-4 h-4 text-blue-600" />
                          )}
                          <h4 className="font-medium text-foreground">{template.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                        <div className="text-xs text-muted-foreground">
                          {template.documents.length} documents • {template.category}
                        </div>
                      </div>
                    ))}
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
