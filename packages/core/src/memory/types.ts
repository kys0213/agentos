export type NodeType = 'query'|'answer'|'feedback'|'entity';
export type EdgeType = 'similar_to'|'responded_with'|'has_feedback'|'refers_to_entity';

export interface BaseNode {
  id: string;
  type: NodeType;
  text?: string;
  canonicalKey?: string;
  embedding?: number[] | Map<number, number>;
  createdAt: number;
  lastAccess: number;
  weights: { repeat: number; feedback: number };
  degree: number;
  pinned?: boolean;
}

export interface Edge {
  id: string;
  from: string;
  to: string;
  type: EdgeType;
  weight: number;
  createdAt: number;
  lastAccess: number;
}

export interface GraphConfig {
  maxNodes: number;
  maxEdges: number;
  halfLifeMin: number;
  tauDup: number;
  tauSim: number;
  protectMinDegree: number;
  enableInvertedIndex?: boolean;
}

export interface EmbeddingProvider {
  embed(text: string): number[] | Map<number, number>;
  exportState?(): any;
  importState?(s: any): void;
}

