// Core knowledge domain types

export type PresetId = string & { readonly __brand: 'PresetId' };
export type KnowledgeDocId = string & { readonly __brand: 'KnowledgeDocId' };

export interface TocItem {
  title: string;
  anchor?: string;
  level: number; // 1 = h1, 2 = h2, ...
  position: number; // line or offset start
  children?: TocItem[];
}

export interface KnowledgeDocumentMeta {
  id: KnowledgeDocId;
  presetId: PresetId;
  title: string;
  uri?: string;
  createdAt: Date;
  updatedAt: Date;
  mimeType: 'text/markdown';
  toc?: TocItem[];
}

export interface BreadcrumbNode {
  title: string;
  anchor?: string;
  level: number;
}

export interface SourceRange {
  lineStart?: number;
  lineEnd?: number;
  offsetStart?: number;
  offsetEnd?: number;
}

export interface KnowledgeChunk {
  docId: KnowledgeDocId;
  chunkId: string;
  text: string;
  position: number;
  breadcrumbs?: BreadcrumbNode[];
  anchors?: string[];
  source?: SourceRange;
}
