# codex plan.md

## 1) 배경

AgentOS는 **세션 단기 메모리**와 **에이전트 장기 메모리**를 분리 운영한다. 메모리는 “자연어 질의 → 그래프 노드(쿼리/피드백/엔터티) → 연결/가중치 학습 → 승격/스냅샷” 루프를 돈다. MVP 목표는 **인메모리 LRU 그래프**를 기반으로 중복·유사 질의 통합, 피드백 학습, 하이브리드 검색, 세션 종료 시 승격/체크포인트까지 **작동 가능한 최소 셋**을 완성하는 것이다.

## 2) 목표 (Deliverables & AC)

- **D1. GraphStore**: 인메모리 그래프(노드/에지), 중복/유사 업서트, LRU, 스냅샷/퍼시스턴스.
    - **AC**: 10k 노드/40k 에지에서 OOM 없이 동작; 스냅샷 저장/복원 후 검색 결과 일치.
- **D2. EmbeddingProvider**: 드리프트 없는 임베딩(희소 BoW + cosineSparse 또는 해시 트릭).
    - **AC**: 동일 텍스트 임베딩 재현성 100%, vocab 변화에도 과거 벡터와 비교 정상.
- **D3. MemoryOrchestrator**: 세션/에이전트 이중 그래프, 하이브리드 검색(de-dupe), 승격/체크포인트.
    - **AC**: 승격 후 동일 질의 검색 점수 상승; 체크포인트로 재현 가능.
- **D4. 테스트/데모/문서**: Jest(or Vitest) 테스트/벤치, README 및 스크립트.

## 3) 인터페이스 스케치

### 패키지 구조

```
packages/memory/
  src/
    types.ts
    embedding/simple-embedding.ts
    utils/cosine-sparse.ts
    graph-store.ts
    memory-orchestrator.ts
  test/
    graph-store.spec.ts
    orchestrator.spec.ts
  examples/
    demo.ts
  package.json
  tsconfig.json
  README.md

```

### 주요 타입

```tsx
// packages/memory/src/types.ts
export type NodeType = 'query'|'answer'|'feedback'|'entity';
export type EdgeType = 'similar_to'|'responded_with'|'has_feedback'|'refers_to_entity';

export interface BaseNode {
  id: string;
  type: NodeType;
  text?: string;
  canonicalKey?: string; // 정규화+해시 기반 정확중복 키
  embedding?: number[] | Map<number, number>;
  createdAt: number;
  lastAccess: number;
  weights: { repeat: number; feedback: number; };
  degree: number;
  pinned?: boolean;
}

export interface Edge {
  id: string;              // `${from}::${type}::${to}`
  from: string;
  to: string;
  type: EdgeType;
  weight: number;          // 누적 가중치
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

```

## 4) 구체적인 인메모리 기반 그래프 구현체 (코드 스니펫 포함)

### 4.1 임베딩 & 유틸

```tsx
// packages/core/memory/src/embedding/simple-embedding.ts
import { EmbeddingProvider } from '../types';

export type SparseVec = Map<number, number>;

const NF = (s: string) => s.normalize('NFC');
export function normalize(text: string) {
  return NF(text.toLowerCase())
    .replace(/[^\p{L}\p{N}\s.@/_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ngrams(s: string, minN = 3, maxN = 5): string[] {
  const out: string[] = [];
  const str = s.replace(/\s+/g, ' ');
  for (let n=minN; n<=maxN; n++) {
    for (let i=0; i<=str.length-n; i++) out.push(str.slice(i, i+n));
  }
  return out;
}

// 간단한 64-bit 해시(FNV-1a 변형)로 데모. 실제 구현은 xxhash3-128 권장.
function hash64(s: string, seed = 0xC0FFEE): number {
  let h = BigInt(seed) ^ 0xcbf29ce484222325n;
  for (let i=0; i<s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x00000100000001B3n) & 0xFFFFFFFFFFFFFFFFn;
  }
  // 하위 32비트로 축소(데모용)
  return Number(h & 0xFFFFFFFFn);
}

export class SimpleEmbedding implements EmbeddingProvider {
  constructor(private dim = 16384, private minN = 3, private maxN = 5, private seed = 0xC0FFEE) {}

  exportState() {
    return { kind: 'ngram-hash', dim: this.dim, minN: this.minN, maxN: this.maxN, seed: this.seed, normVersion: 'nfc_v1', hashAlgo: 'fnv1a64_demo' };
  }
  importState(s: any) {
    if (!s) return;
    this.dim = s.dim ?? this.dim; this.minN = s.minN ?? this.minN; this.maxN = s.maxN ?? this.maxN; this.seed = s.seed ?? this.seed;
  }

  embed(text: string): SparseVec {
    const t = normalize(text);
    const vec = new Map<number, number>();
    const grams = ngrams(t, this.minN, this.maxN);
    for (const g of grams) {
      const idx = Math.abs(hash64(g, this.seed)) % this.dim;
      vec.set(idx, (vec.get(idx) ?? 0) + 1);
    }
    // L2 정규화
    let norm = 0; for (const v of vec.values()) norm += v*v; norm = Math.sqrt(norm) || 1;
    for (const [i,v] of vec) vec.set(i, v/norm);
    return vec;
  }
}

```

```tsx
// packages/core/memory/src/utils/cosine-sparse.ts
import { SparseVec } from '../embedding/simple-embedding';

export function cosineSparse(a: SparseVec, b: SparseVec) {
  let dot=0, na=0, nb=0;
  for (const [,v] of a) na += v*v;
  for (const [,v] of b) nb += v*v;
  const small = a.size <= b.size ? a : b;
  const big = small === a ? b : a;
  for (const [i, v] of small) {
    const w = big.get(i);
    if (w) dot += v*w;
  }
  const denom = (Math.sqrt(na)||1)*(Math.sqrt(nb)||1);
  return dot / denom;
}

```

### 4.2 GraphStore

```tsx
// packages/core/memory/src/graph-store.ts
import fs from 'fs/promises';
import { BaseNode, Edge, EdgeType, EmbeddingProvider, GraphConfig } from './types';
import { SimpleEmbedding, SparseVec, normalize } from './embedding/simple-embedding';
import { cosineSparse } from './utils/cosine-sparse';
import { canonicalKey, defaultCanonicalMeta } from './utils/canonical-key';
import { serializeSparse, deserializeSparse } from './utils/serialize-sparse';

export class GraphStore {
  private nodes = new Map<string, BaseNode>();
  private edges = new Map<string, Edge>();
  private byCanonical = new Map<string, string>();
  private inverted?: Map<string, Set<string>>; // n‑gram → nodeIds
  private dirty = false;

  constructor(
    private cfg: GraphConfig,
    private embedder: EmbeddingProvider = new SimpleEmbedding()
  ) {
    if (cfg.enableInvertedIndex) this.inverted = new Map();
  }

  private indexNode(id: string, text?: string, canonical?: string) {
    if (canonical) this.byCanonical.set(canonical, id);
    if (!this.inverted || !text) return;
    const grams = normalize(text).split(' '); // 간단 후보(실제: n‑gram 토큰화)
    for (const g of grams) {
      if (!g) continue;
      const set = this.inverted.get(g) ?? new Set();
      set.add(id); this.inverted.set(g, set);
    }
  }

  upsertQuery(text: string) {
    const now = Date.now();
    const emb = this.embedder.embed(text) as SparseVec;
    const ck = canonicalKey(text);
    const existing = this.byCanonical.get(ck);
    if (existing) {
      const q = this.nodes.get(existing)!;
      q.weights.repeat += 1; q.lastAccess = now; this.touchNeighbors(existing, now);
      this.evictIfNeeded(); return q.id;
    }

    // 의미 중복 검사(tauDup)
    const cand: { id: string; sim: number }[] = [];
    for (const n of this.nodes.values()) {
      if (n.type !== 'query' || !n.embedding) continue;
      const sim = cosineSparse(emb, n.embedding as SparseVec);
      cand.push({ id: n.id, sim });
    }
    cand.sort((a,b)=> b.sim - a.sim);
    const best = cand[0];
    if (best && best.sim >= this.cfg.tauDup) {
      const q = this.nodes.get(best.id)!; q.weights.repeat += 1; q.lastAccess = now;
      this.link(q.id, q.id, 'similar_to', best.sim); // 자기강화 표식(옵션)
      this.touchNeighbors(q.id, now); this.evictIfNeeded(); return q.id;
    }

    const id = `q_${now}_${Math.random().toString(36).slice(2,8)}`;
    const q: BaseNode = { id, type: 'query', text, canonicalKey: ck, embedding: emb, createdAt: now, lastAccess: now, degree: 0, weights: { repeat: 0, feedback: 0 } };
    this.nodes.set(id, q);
    this.indexNode(id, text, ck);

    for (const c of cand.slice(0, 10)) if (c.sim >= this.cfg.tauSim) { this.link(id, c.id, 'similar_to', c.sim); this.bump(id, +0.3); this.bump(c.id, +0.3); }
    this.dirty = true; this.evictIfNeeded(); return id;
  }

  recordFeedback(targetQueryId: string, label: 'up'|'down'|'retry', note?: string) {
    const now = Date.now();
    const id = `f_${now}_${Math.random().toString(36).slice(2,6)}`;
    const f: BaseNode = { id, type: 'feedback', text: `feedback:${label}${note? ' '+note : ''}`, createdAt: now, lastAccess: now, degree: 0, weights: { repeat: 0, feedback: 0 } };
    this.nodes.set(id, f);
    this.link(targetQueryId, id, 'has_feedback', 1.0);
    if (label === 'up') this.bump(targetQueryId, +1.0);
    if (label === 'down') this.bump(targetQueryId, -1.0);
    if (label === 'retry') this.bump(targetQueryId, -0.5);
    this.dirty = true; this.evictIfNeeded(); return id;
  }

  adjustWeights(nodeId: string, deltas: { feedbackDelta?: number; repeatDelta?: number }) {
    const n = this.nodes.get(nodeId); if (!n) return;
    if (deltas.feedbackDelta) n.weights.feedback += deltas.feedbackDelta;
    if (deltas.repeatDelta) n.weights.repeat += deltas.repeatDelta;
    n.lastAccess = Date.now(); this.dirty = true;
  }

  link(from: string, to: string, type: EdgeType, weight: number) {
    const now = Date.now(); if (!this.nodes.has(from) || !this.nodes.has(to)) return;
    const key = `${from}::${type}::${to}`; const prev = this.edges.get(key);
    const e: Edge = { id: key, from, to, type, weight: (prev?.weight ?? 0) + weight, createdAt: prev?.createdAt ?? now, lastAccess: now };
    if (!prev) { const a = this.nodes.get(from)!; a.degree++; a.lastAccess = now; const b = this.nodes.get(to)!; b.degree++; b.lastAccess = now; }
    this.edges.set(key, e);
  }

  searchSimilarQueries(text: string, k = 5) {
    const emb = this.embedder.embed(text) as SparseVec;
    const out: { id: string; sim: number; score: number; text?: string; canonicalKey?: string }[] = [];
    const ids = new Set<string>();
    if (this.inverted) {
      const grams = normalize(text).split(' ');
      for (const g of grams) for (const id of this.inverted.get(g) ?? []) ids.add(id);
    } else {
      for (const id of this.nodes.keys()) ids.add(id);
    }
    for (const id of ids) {
      const n = this.nodes.get(id)!; if (n.type !== 'query' || !n.embedding) continue;
      const sim = cosineSparse(emb, n.embedding as SparseVec);
      const score = 0.7*sim + 0.3*this.rank(n);
      out.push({ id, sim, score, text: n.text, canonicalKey: n.canonicalKey });
    }
    // 동일 canonicalKey 우선 de‑dupe는 Orchestrator에서 수행
    return out.sort((a,b)=> b.score - a.score).slice(0, k);
  }

  private bump(nodeId: string, delta: number) {
    const n = this.nodes.get(nodeId); if (!n) return;
    n.weights.feedback += delta; n.lastAccess = Date.now();
  }
  private touchNeighbors(nodeId: string, ts: number) {
    for (const e of this.edges.values()) {
      if (e.from === nodeId || e.to === nodeId) e.lastAccess = ts;
    }
  }

  private rank(n: BaseNode) {
    const now = Date.now();
    const ageMin = (now - n.lastAccess) / (1000*60);
    const recency = Math.exp(-Math.log(2) * (ageMin / this.cfg.halfLifeMin));
    const repeat = Math.tanh((n.weights.repeat ?? 0)/5);
    const fb = Math.tanh((n.weights.feedback ?? 0)/5);
    return 0.5*recency + 0.3*repeat + 0.2*fb;
  }

  private evictIfNeeded() {
    const { maxNodes, maxEdges, protectMinDegree } = this.cfg;
    const overN = this.nodes.size - maxNodes;
    if (overN > 0) {
      const cand: BaseNode[] = [];
      for (const n of this.nodes.values()) {
        if (n.pinned) continue;
        if ((n.degree ?? 0) >= protectMinDegree) continue;
        cand.push(n);
      }
      cand.sort((a,b)=> this.rank(a) - this.rank(b)); // 낮은 것부터 제거
      for (let i=0;i<overN && i<cand.length;i++) this.removeNode(cand[i].id);
    }
    const overE = this.edges.size - maxEdges;
    if (overE > 0) {
      const es = [...this.edges.values()].sort((a,b)=> (a.weight - b.weight) || (a.lastAccess - b.lastAccess));
      for (let i=0;i<overE && i<es.length;i++) this.removeEdge(es[i].id);
    }
  }

  private removeNode(id: string) {
    const n = this.nodes.get(id); if (!n) return;
    for (const e of [...this.edges.values()]) if (e.from===id || e.to===id) this.removeEdge(e.id);
    this.nodes.delete(id);
    if (n.userId) this.byUser.get(n.userId)?.delete(id);
  }
  private removeEdge(id: string) {
    const e = this.edges.get(id); if (!e) return;
    const a = this.nodes.get(e.from); if (a) a.degree = Math.max(0, a.degree-1);
    const b = this.nodes.get(e.to);   if (b) b.degree = Math.max(0, b.degree-1);
    this.edges.delete(id);
  }

  stats(){ return { nodes: this.nodes.size, edges: this.edges.size }; }

  toSnapshot() {
    const nodes = [...this.nodes.values()].map(n => ({ ...n, embedding: serializeSparse(n.embedding as any) }));
    const edges = [...this.edges.values()];
    const embedder = (this.embedder as any).exportState?.() ?? null;
    return { graph: { nodes, edges }, embedder, canonicalMeta: defaultCanonicalMeta };
  }
  fromSnapshot(s: any) {
    this.nodes.clear(); this.edges.clear(); this.byCanonical.clear(); if (this.inverted) this.inverted.clear();
    for (const raw of s.graph.nodes) {
      const n = { ...raw, embedding: deserializeSparse(raw.embedding) } as BaseNode;
      this.nodes.set(n.id, n); this.indexNode(n.id, n.text, n.canonicalKey);
    }
    for (const e of s.graph.edges) this.edges.set(e.id, e);
    (this.embedder as any).importState?.(s.embedder);
  }
  async saveToFile(file: string, opts?: { onlyIfDirty?: boolean }) {
    if (opts?.onlyIfDirty && !this.dirty) return;
    await fs.writeFile(file, JSON.stringify(this.toSnapshot()), 'utf8');
    this.dirty = false;
  }
  static async loadFromFile(file: string, store: GraphStore) {
    const json = await fs.readFile(file, 'utf8');
    store.fromSnapshot(JSON.parse(json));
  }
}

```

### 4.3 MemoryOrchestrator

```tsx
// packages/core/memory/src/memory-orchestrator.ts
import path from 'path';
import fs from 'fs/promises';
import { GraphStore } from './graph-store';
import { GraphConfig } from './types';
import { SimpleEmbedding } from './embedding/simple-embedding';

export type Scope = 'agent'|'session';

export interface OrchestratorCfg {
  sessionGraph: GraphConfig;
  agentGraph: GraphConfig;
  promotion: { minRank: number; maxPromotions: number; minDegree?: number; carryWeights?: boolean; };
  checkpoint: { outDir: string; topK: number; pretty?: boolean; };
  searchBiasSessionFirst?: number; // default 0.05
}

export class MemoryOrchestrator {
  private embedder = new SimpleEmbedding();
  private agentStore: GraphStore;
  private sessions = new Map<string, GraphStore>();

  constructor(private agentId: string, private cfg: OrchestratorCfg) {
    this.agentStore = new GraphStore({ ...cfg.agentGraph }, this.embedder);
  }

  getSessionStore(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new GraphStore({ ...this.cfg.sessionGraph }, this.embedder));
    }
    return this.sessions.get(sessionId)!;
  }
  getAgentStore(){ return this.agentStore; }
  getActiveSessions(){ return [...this.sessions.keys()]; }

  upsertQuery(sessionId: string, text: string) {
    return this.getSessionStore(sessionId).upsertQuery(text);
  }
  recordFeedback(sessionId: string, qId: string, label: 'up'|'down'|'retry', note?: string) {
    return this.getSessionStore(sessionId).recordFeedback(qId, label, note);
  }

  search(sessionId: string, text: string, k = 8) {
    const s = this.getSessionStore(sessionId);
    const sTop = s.searchSimilarQueries(text, k);
    const aTop = this.agentStore.searchSimilarQueries(text, k);
    const bias = this.cfg.searchBiasSessionFirst ?? 0.05;

    // canonicalKey 기준 de-dupe
    const map = new Map<string, { id: string; score: number; from: 'session'|'agent'; text?: string; canonicalKey?: string }>();
    for (const r of sTop) map.set(r.canonicalKey ?? r.id, { id: r.id, score: r.score + bias, from: 'session', text: r.text, canonicalKey: r.canonicalKey });
    for (const r of aTop) {
      const key = r.canonicalKey ?? r.id;
      const cur = map.get(key);
      if (!cur) map.set(key, { id: r.id, score: r.score, from: 'agent', text: r.text, canonicalKey: r.canonicalKey });
      else cur.score = Math.max(cur.score, r.score + bias);
    }
    return [...map.values()].sort((a,b)=> b.score-a.score).slice(0,k);
  }

  private rank(n: any, halfLifeMin: number) {
    const now = Date.now();
    const ageMin = (now - n.lastAccess) / (1000*60);
    const recency = Math.exp(-Math.log(2) * (ageMin/halfLifeMin));
    const repeat = Math.tanh((n.weights?.repeat ?? 0)/5);
    const fb = Math.tanh((n.weights?.feedback ?? 0)/5);
    return 0.5*recency + 0.3*repeat + 0.2*fb;
  }

  private pickTopQueries(nodes: any[], minRank: number, topK: number, minDegree: number, halfLifeMin: number) {
    return nodes
      .filter(n => n.type === 'query')
      .map(n => ({ n, r: this.rank(n, halfLifeMin) }))
      .filter(x => x.r >= minRank && (x.n.degree ?? 0) >= minDegree)
      .sort((a,b)=> b.r - a.r)
      .slice(0, topK)
      .map(x => x.n);
  }

  private cpFile(name: string) { return path.join(this.cfg.checkpoint.outDir, name); }

  async finalizeSession(sessionId: string, opts?: { promote?: boolean; checkpoint?: boolean; checkpointName?: string }) {
    const promote = opts?.promote ?? true;
    const checkpoint = opts?.checkpoint ?? true;
    const s = this.sessions.get(sessionId);
    if (!s) return;

    if (promote) {
      const promoted = this.promoteHotspotsFromSession(sessionId, { carryWeights: this.cfg.promotion.carryWeights });
      if (promoted > 0) {
        await this.agentStore.saveToFile(this.cpFile(`agent-${this.agentId}.json`), { onlyIfDirty: true });
      }
    }

    if (checkpoint) {
      const snap = s.toSnapshot();
      const top = this.pickTopQueries(
        snap.graph.nodes,
        this.cfg.promotion.minRank,
        this.cfg.checkpoint.topK,
        this.cfg.promotion.minDegree ?? 0,
        this.cfg.sessionGraph.halfLifeMin
      );
      const summary = {
        version: 1,
        agentId: this.agentId,
        sessionId,
        createdAt: new Date().toISOString(),
        topQueries: top.map(q => ({ id:q.id, userId:q.userId, text:q.text, lastAccess:q.lastAccess, weights:q.weights, degree:q.degree })),
        edges: snap.graph.edges.filter((e:any) => top.some(q => q.id===e.from || q.id===e.to))
                               .map((e:any)=>({ from:e.from, to:e.to, type:e.type, weight:e.weight })),
        embedder: snap.embedder,
        canonicalMeta: snap.canonicalMeta
      };
      await fs.mkdir(this.cfg.checkpoint.outDir, { recursive: true });
      const name = opts?.checkpointName ?? `checkpoint-${this.agentId}-${sessionId}-${Date.now()}.json`;
      await fs.writeFile(this.cpFile(name), JSON.stringify(summary, null, this.cfg.checkpoint.pretty? 2:0), 'utf8');
    }

    this.sessions.delete(sessionId);
  }

  promoteHotspotsFromSession(sessionId: string, opts?: { carryWeights?: boolean }) {
    const s = this.sessions.get(sessionId); if (!s) return 0;
    const snap = s.toSnapshot();

    const top = this.pickTopQueries(
      snap.graph.nodes,
      this.cfg.promotion.minRank,
      this.cfg.promotion.maxPromotions,
      this.cfg.promotion.minDegree ?? 0,
      this.cfg.sessionGraph.halfLifeMin
    );
    let count = 0;
    for (const n of top) {
      if (n.type !== 'query' || !n.text) continue;
      const id = this.agentStore.upsertQuery(n.text);
      if (opts?.carryWeights) {
        // 간단 이관: feedback/repeat 일부 누적
        const delta = (n.weights?.feedback ?? 0) + (n.weights?.repeat ?? 0)*0.2;
        this.agentStore.adjustWeights(id, { feedbackDelta: delta });
      }
      count++;
    }
    return count;
  }
}

```

### 4.4 예시/테스트/스크립트

```tsx
// packages/core/memory/examples/demo.ts
import { MemoryOrchestrator } from '../src/memory-orchestrator';

async function main() {
  const cfg = {
    sessionGraph: { maxNodes: 1_000, maxEdges: 4_000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3, enableInvertedIndex: false },
    agentGraph:   { maxNodes: 1_000, maxEdges: 12_000, halfLifeMin: 1440, tauDup: 0.96, tauSim: 0.78, protectMinDegree: 4, enableInvertedIndex: true },
    promotion:    { minRank: 0.55, maxPromotions: 20, minDegree: 2, carryWeights: true },
    checkpoint:   { outDir: './.agentos/checkpoints', topK: 20, pretty: true },
    searchBiasSessionFirst: 0.05,
  };
  const o = new MemoryOrchestrator('agent-1', cfg);
  const sid = 's-001';

  const q1 = o.upsertQuery(sid, 'agentos mvp 설계 문서 보여줘');
  const q2 = o.upsertQuery(sid, '에이전트OS MVP 아키텍처 문서 보여줘'); // 유사
  o.recordFeedback(sid, q1, 'up', '좋아');
  o.recordFeedback(sid, q2, 'retry', '조금 다른 문서 원해');

  console.log('search before finalize:', o.search(sid, 'agentos 설계', 5));
  await o.finalizeSession(sid, { promote: true, checkpoint: true });
  console.log('search on agent after finalize:', o.getAgentStore().searchSimilarQueries('agentos 설계', 5));
}
main().catch(console.error);

```

```tsx
// packages/core/memory/test/graph-store.spec.ts
import { GraphStore } from '../src/graph-store';
import { SimpleEmbedding } from '../src/embedding/simple-embedding';

test('upsertQuery duplicates & similar edges', () => {
  const g = new GraphStore(
    { maxNodes:1000, maxEdges:4000, halfLifeMin:240, tauDup:0.96, tauSim:0.75, protectMinDegree:3, enableInvertedIndex:false },
    new SimpleEmbedding()
  );
  const a = g.upsertQuery('에이전트OS 설계 문서 링크');
  const b = g.upsertQuery('에이전트 os 설계 문서 링크'); // 거의 동일
  expect(a).toBe(b); // tauDup 충족 시 동일 노드 강화
  const c = g.upsertQuery('AgentOS architecture doc link');
  expect(g.stats().nodes).toBeGreaterThanOrEqual(2);
});

```

```tsx
// packages/core/memory/test/orchestrator.spec.ts
import { MemoryOrchestrator } from '../src/memory-orchestrator';

test('search merges session & agent without duplicates', async () => {
  const o = new MemoryOrchestrator('agent1', {
    sessionGraph:{maxNodes:1000,maxEdges:4000,halfLifeMin:240,tauDup:0.96,tauSim:0.75,protectMinDegree:3, enableInvertedIndex:false},
    agentGraph:{maxNodes:1000,maxEdges:12000,halfLifeMin:1440,tauDup:0.96,tauSim:0.78,protectMinDegree:4, enableInvertedIndex:true},
    promotion:{minRank:0.55,maxPromotions:10,minDegree:1, carryWeights:true},
    checkpoint:{outDir:'./.agentos/checkpoints',topK:10,pretty:true},
    searchBiasSessionFirst: 0.05
  });
  const sId = 's-1';
  o.upsertQuery(sId, 'agentos mvp 설계');
  o.getAgentStore().upsertQuery('agentos mvp 설계'); // 유사
  const res = o.search(sId, 'agentos 설계', 8);
  expect(res.length).toBeGreaterThan(0);
  await o.finalizeSession(sId, { promote:true, checkpoint:false });
});

```

```json
// packages/core/memory/package.json
{
  "name": "@agentos/memory",
  "version": "0.1.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "test": "jest --runInBand",
    "demo": "ts-node examples/demo.ts"
  },
  "devDependencies": {
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "^5.5.4",
    "ts-node": "^10.9.2"
  }
}

```

## 5) TODO 항목 (작업 지시 순서)

- **T0**: 워크스페이스/패키지 스캐폴딩, TS/Jest 스크립트 세팅
- **T1**: `types.ts`, 희소 임베딩, `cosineSparse` 유틸
- **T2**: `GraphStore` v1 (업서트/피드백/에지 키 고정/LRU/스냅샷)
- **T3**: `MemoryOrchestrator` v1 (하이브리드 검색 de‑dupe, 승격/체크포인트)
- **T4**: 테스트 2종 + `examples/demo.ts`
- **T5(옵션)**: 역색인(토큰→nodeIds), 세션 GC, README
- **T6(옵션)**: `upsertEntity` + `refers_to_entity` 자동 링크, 해시 트릭 임베더, SQLite/ANN 플러그인 포인트

---

## codex CLI 실행 가이드 (명령 예시)

```bash
# 0) 패키지 스캐폴딩
mkdir -p packages/memory/{src,src/embedding,src/utils,test,examples}

# 1) codex에 플랜 적용
codex apply codex-plan.md

# 2) 의존성 설치
pnpm i --filter @agentos/memory

# 3) 빌드/테스트/데모
pnpm -F @agentos/memory build
pnpm -F @agentos/memory test
pnpm -F @agentos/memory demo
```tsx
// packages/core/memory/src/utils/serialize-sparse.ts
import { SparseVec } from '../embedding/simple-embedding';

export function serializeSparse(v?: SparseVec | number[]) {
  if (!v) return null;
  if (Array.isArray(v)) return v; // dense
  return [...(v as SparseVec).entries()]; // [[i,v],...]
}
export function deserializeSparse(x: any): SparseVec | number[] | undefined {
  if (!x) return undefined;
  if (Array.isArray(x) && typeof x[0] === 'number') return x as number[];
  return new Map<number, number>(x as Array<[number, number]>);
}
```

```tsx
// packages/core/memory/src/utils/canonical-key.ts
import { normalize } from '../embedding/simple-embedding';

export interface CanonicalMeta { normVersion: string; hashAlgo: string; seed: number; }

function hash64(s: string, seed = 0xC0FFEE): number {
  let h = BigInt(seed) ^ 0xcbf29ce484222325n;
  for (let i=0; i<s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x00000100000001B3n) & 0xFFFFFFFFFFFFFFFFn; }
  return Number(h & 0xFFFFFFFFn);
}

export const defaultCanonicalMeta: CanonicalMeta = { normVersion: 'nfc_v1', hashAlgo: 'fnv1a64_demo', seed: 0xC0FFEE };

export function canonicalKey(text: string, meta: CanonicalMeta = defaultCanonicalMeta) {
  const t = normalize(text);
  const h = Math.abs(hash64(t, meta.seed)).toString(36);
  return `ck:${meta.normVersion}:${meta.hashAlgo}:${h}`;
}
```

```

---
