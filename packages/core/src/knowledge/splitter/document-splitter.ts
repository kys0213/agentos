import { KnowledgeChunk, KnowledgeDocumentMeta } from '../types';

export interface SplitterOptions {
  maxChars?: number; // default 1500
  overlapChars?: number; // default 200
  maxHeadingDepth?: number; // default 3 (H1~H3)
}

export interface DocumentSplitter {
  split(
    meta: KnowledgeDocumentMeta,
    content: string,
    options?: SplitterOptions
  ): Promise<KnowledgeChunk[]>;
}


