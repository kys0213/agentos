export type KnowledgeDoc = {
  id: string;
  agentId: string;
  title: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  size: number;
  type: 'markdown' | 'text';
  filename?: string;
};

export type KnowledgeStats = {
  totalDocuments: number;
  indexedDocuments: number;
  vectorizedDocuments?: number;
  totalChunks?: number;
  lastUpdated?: Date;
  storageSize: number;
};

export type SearchFilters = { tags?: string[] };

export type SearchResult = {
  docId: string;
  score: number;
  title: string;
  snippet?: string;
};

export interface KnowledgeStore {
  saveDoc(input: {
    agentId: string;
    title: string;
    content?: string;
    fileRef?: string;
    tags?: string[];
  }): Promise<KnowledgeDoc>;
  listDocs(agentId: string, options?: { cursor?: string; limit?: number }): Promise<{
    items: KnowledgeDoc[];
    hasMore: boolean;
    nextCursor: string;
  }>;
  deleteDoc(agentId: string, docId: string): Promise<{ success: boolean }>;
  readDoc(agentId: string, docId: string): Promise<KnowledgeDoc | null>;
  stats(agentId: string): Promise<KnowledgeStats>;
}

export interface BM25Index {
  addOrUpdate(docId: string, fields: { title: string; body: string }): Promise<void>;
  remove(docId: string): Promise<void>;
  search(
    query: string,
    options?: { topK?: number; filters?: SearchFilters }
  ): Promise<SearchResult[]>;
  stats(): Promise<{ docCount: number; lastBuiltAt?: Date }>;
}

