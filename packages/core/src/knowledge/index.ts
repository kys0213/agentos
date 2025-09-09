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
  listDocs(
    agentId: string,
    options?: { cursor?: string; limit?: number }
  ): Promise<{
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

// Re-export modern indexing architecture under the knowledge subpath for convenience
export * as Indexing from './indexing/interfaces';
export { DefaultIndexSet } from './indexing/index-set';
export { FileDocStore } from './indexing/file-doc-store';
export { Bm25SearchIndex } from './indexing/bm25-search-index';
export { KnowledgeRepositoryImpl } from './indexing/repository-impl';

// Expose tokenizer and splitter utilities
export type { Tokenizer, KeywordExtractor } from './tokenizer';
export { EnglishSimpleTokenizer } from './english-simple-tokenizer';
export { LlmKeywordTokenizer } from './llm-keyword-tokenizer';

export type { DocumentSplitter, SplitterOptions } from './splitter/document-splitter';
export { MarkdownSplitter } from './splitter/markdown-splitter';

// Expose in-memory BM25 building blocks for advanced consumers
export {
  InMemoryBM25Index,
  type BM25IndexOptions,
  type BM25SearchResult,
} from './bm25/bm25-index';

// Expose core knowledge domain types used by splitters
export type {
  KnowledgeChunk,
  KnowledgeDocumentMeta,
  BreadcrumbNode,
  SourceRange,
  TocItem,
  PresetId,
  KnowledgeDocId,
} from './types';
