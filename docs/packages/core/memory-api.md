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
  summary?: string;             // optional sleep-cycle summary text
  sourceNodeIds?: string[];     // provenance for merged nodes
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

type SleepCycleTrigger = 'session-finalize' | 'eviction' | 'interval';

interface SleepCycleBaseOptions {
  maxClusters: number;
  maxInspect: number;
  minClusterSize: number;
  similarityThreshold: number;
  minRank: number;
  summaryMaxLength: number;
  cooldownMs: number;
}

interface SleepCycleConfig {
  summarizer: SleepCycleSummarizer;
  defaults?: Partial<SleepCycleBaseOptions>;
  emit?: (report: SleepCycleReport) => void;
}

interface SleepCycleRunOptions extends Partial<SleepCycleBaseOptions> {
  trigger?: SleepCycleTrigger;
  force?: boolean;
}

interface SleepCycleSummarizer {
  summarize(texts: string[], opts: { maxLength: number }): string;
}

interface SleepCycleClusterReport {
  anchorId: string;
  mergedNodeIds: string[];
  summary: string;
  beforeRank: number;
  afterRank: number;
  freedNodes: number;
}

interface SleepCycleReport {
  trigger: SleepCycleTrigger;
  clusters: SleepCycleClusterReport[];
  freedCapacity: number;
  inspected: number;
  timestamp: number;
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

  configureSleepCycle(cfg: SleepCycleConfig): void;
  runSleepCycle(options?: SleepCycleRunOptions): SleepCycleReport | null;

  link(from: string, to: string, type: EdgeType, weight: number): void;

  toSnapshot(): any;            // { graph:{nodes,edges}, embedder, canonicalMeta }
  fromSnapshot(s: any): void;
  saveToFile(file: string, opts?: { onlyIfDirty?: boolean }): Promise<void>;
  static loadFromFile(file: string, store: GraphStore): Promise<void>;

  stats(): { nodes: number; edges: number };
}
```

Sleep-cycle consolidation:

- `configureSleepCycle` wires an on-device summarizer and optional defaults for consolidation batches.
- `runSleepCycle` (invoked manually or by internal triggers) clusters low-rank similar queries, merges them into an anchor node,
  stores the summarizer output in `summary`, and tracks provenance via `sourceNodeIds`.
- The returned `SleepCycleReport` provides metrics (`freedCapacity`, inspected nodes, cluster details) for logging dashboards or
  telemetry hooks.

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
  sleepCycle?: {
    summarizer: SleepCycleSummarizer;
    defaults?: Partial<SleepCycleBaseOptions>;
    runOnFinalize?: boolean;
    runOptions?: SleepCycleRunOptions;
    emit?: (scope: Scope, report: SleepCycleReport) => void;
  };
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

Sleep-cycle orchestration:

- Provide `sleepCycle` in the config to register the same summarizer against both the agent and session stores.
- When `runOnFinalize` is not disabled, `finalizeSession` forces a sleep-cycle pass before promotions/checkpoints so that
  consolidated summaries propagate to long-term memory snapshots.
- `emit` hooks receive `(scope, report)` pairs, enabling dashboards to distinguish session-vs-agent cleanups.

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
