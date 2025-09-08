// Minimal, backend-agnostic interfaces for Knowledge indexing/search.
// Keep dependency surface small and avoid vendor coupling.

export type KnowledgeId = string & { readonly __brand: 'KnowledgeId' };
export type DocId = string & { readonly __brand: 'DocId' };

export interface KnowledgeDoc {
  id: DocId;
  title: string;
  tags?: string[];
  source: { kind: 'text'; text: string } | { kind: 'fileRef'; path: string };
  createdAt: string;
  updatedAt: string;
  indexedAt?: string;
  status: 'draft' | 'ready' | 'indexing' | 'indexed' | 'failed';
}

export interface IndexRecord {
  id: DocId;
  fields: Record<string, string | number | string[]>;
  extensions?: Record<string, unknown>;
}

export interface DocumentMapper {
  toRecords(doc: KnowledgeDoc): AsyncIterable<IndexRecord>;
}

export interface Query {
  text?: string;
  filters?: Record<string, unknown>;
  topK?: number;
  extensions?: Record<string, unknown>;
}

export interface SearchHit {
  docId: DocId;
  score: number;
  highlights?: string[];
  indexName: string;
}

export interface IndexStats {
  docCount: number;
  lastBuiltAt?: string;
}

export interface SearchIndex {
  readonly name: string;
  upsert(records: AsyncIterable<IndexRecord>): Promise<void>;
  remove(docIds: AsyncIterable<DocId>): Promise<void>;
  search(query: Query): Promise<SearchHit[]>;
  reindex(allRecords: AsyncIterable<IndexRecord>): Promise<void>;
  stats(): Promise<IndexStats>;
}

export interface MergePolicy {
  merge(results: Record<string, SearchHit[]>, topK: number): SearchHit[];
}

export interface IndexSet {
  list(): SearchIndex[];
  get(name: string): SearchIndex | undefined;
  search(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]>;
  reindex(mapper: DocumentMapper, docs: AsyncIterable<KnowledgeDoc>, target?: string | string[]): Promise<void>;
}

export interface DocStore {
  create(input: Omit<KnowledgeDoc, 'id' | 'createdAt' | 'updatedAt' | 'status'>): Promise<KnowledgeDoc>;
  get(id: DocId): Promise<KnowledgeDoc | null>;
  list(cursor?: string, limit?: number): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }>;
  delete(id: DocId): Promise<void>;
}

export interface Knowledge {
  id: KnowledgeId;
  addDoc(input: { title: string; source: KnowledgeDoc['source']; tags?: string[] }): Promise<KnowledgeDoc>;
  deleteDoc(id: DocId): Promise<void>;
  listDocs(p?: { cursor?: string; limit?: number }): Promise<{ items: KnowledgeDoc[]; nextCursor?: string }>;
  query(q: Query, opts?: { indexes?: string[]; merge?: MergePolicy }): Promise<SearchHit[]>;
  reindex(opts?: { indexes?: string | string[] }): Promise<void>;
  stats(): Promise<Record<string, IndexStats>>;
}

export interface KnowledgeRepository {
  create(params?: { name?: string; initialIndexes?: string[] }): Promise<Knowledge>;
  get(id: KnowledgeId): Promise<Knowledge | null>;
  list(p?: { cursor?: string; limit?: number }): Promise<{ items: Knowledge[]; nextCursor?: string }>;
  delete(id: KnowledgeId): Promise<void>;
}

