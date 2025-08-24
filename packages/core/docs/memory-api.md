# Personalized Memory API (Core)

This document lists the main types and APIs for the memory subsystem.

## Types

- `NodeType = 'query'|'answer'|'feedback'|'entity'`
- `EdgeType = 'similar_to'|'responded_with'|'has_feedback'|'refers_to_entity'`

```
interface BaseNode {
  id: string;
  type: NodeType;
  text?: string;
  canonicalKey?: string;        // normalized+hash key for exact-dup merge
  embedding?: number[] | Map<number, number>;
  createdAt: number;
  lastAccess: number;
  weights: { repeat: number; feedback: number };
  degree: number;
  pinned?: boolean;
}

interface Edge {
  id: string;                   // `${from}::${type}::${to}`
  from: string;
  to: string;
  type: EdgeType;
  weight: number;
  createdAt: number;
  lastAccess: number;
}

interface GraphConfig {
  maxNodes: number;
  maxEdges: number;
  halfLifeMin: number;
  tauDup: number;               // near-duplicate threshold
  tauSim: number;               // similar edge threshold
  protectMinDegree: number;
  enableInvertedIndex?: boolean;// n-gram → nodeIds candidate blocking
}

interface EmbeddingProvider {
  embed(text: string): number[] | Map<number, number>;
  exportState?(): any;
  importState?(s: any): void;
}
```

## GraphStore

```
class GraphStore {
  constructor(cfg: GraphConfig, embedder?: EmbeddingProvider)

  upsertQuery(text: string): string;
  recordFeedback(targetQueryId: string, label: 'up'|'down'|'retry', note?: string): string;
  adjustWeights(nodeId: string, deltas: { feedbackDelta?: number; repeatDelta?: number }): void;
  searchSimilarQueries(text: string, k?: number): Array<{ id: string; score: number; sim: number; text?: string; canonicalKey?: string }>;

  link(from: string, to: string, type: EdgeType, weight: number): void;

  toSnapshot(): any;            // { graph:{nodes,edges}, embedder, canonicalMeta }
  fromSnapshot(s: any): void;
  saveToFile(file: string, opts?: { onlyIfDirty?: boolean }): Promise<void>;
  static loadFromFile(file: string, store: GraphStore): Promise<void>;

  stats(): { nodes: number; edges: number };
}
```

Notes:
- Embeddings are serialized as `[[i,v],...]` for sparse preservation.
- `canonicalMeta` and `embedderState` are included to guarantee reproducibility.

## MemoryOrchestrator

```
type Scope = 'agent'|'session';

interface OrchestratorCfg {
  sessionGraph: GraphConfig;
  agentGraph: GraphConfig;
  promotion: { minRank: number; maxPromotions: number; minDegree?: number; carryWeights?: boolean };
  checkpoint: { outDir: string; topK: number; pretty?: boolean };
  searchBiasSessionFirst?: number;
}

class MemoryOrchestrator {
  constructor(agentId: string, cfg: OrchestratorCfg)

  getSessionStore(sessionId: string): GraphStore;
  getAgentStore(): GraphStore;

  upsertQuery(sessionId: string, text: string): string;
  recordFeedback(sessionId: string, qId: string, label: 'up'|'down'|'retry', note?: string): string;
  search(sessionId: string, text: string, k?: number): Array<{ id: string; score: number; from:'session'|'agent'; text?: string; canonicalKey?: string }>;

  finalizeSession(sessionId: string, opts?: { promote?: boolean; checkpoint?: boolean; checkpointName?: string }): Promise<void>;

  gcSessions(olderThanMs: number): void; // optional utility
  getActiveSessions(): string[];
}
```

## Embedding & canonicalKey
- Embedding default: character n‑gram hashing(3–5) into 16k dims, L2, cosine.
- Canonical key: `hash(normalize(text))` (store meta `{ normVersion, hashAlgo, seed }`).
- Recommended thresholds: `tauDup ~ 0.96`, `tauSim ~ 0.75` (tune per data).

## Checkpoint/Snapshot Format
```
{
  graph: {
    nodes: [ { id, type, text, canonicalKey, embedding:[[i,v],...], createdAt, lastAccess, weights, degree } ],
    edges: [ { id, from, to, type, weight, createdAt, lastAccess } ]
  },
  embedder: { kind, dim, minN, maxN, seed, normVersion, hashAlgo },
  canonicalMeta: { normVersion, hashAlgo, seed }
}
```

## Quality & Tuning
- Use `enableInvertedIndex` only when node counts warrant it.
- Protect nodes with high degree to preserve hubs.
- Consider feedback diffusion to similar neighbors for personalization.

