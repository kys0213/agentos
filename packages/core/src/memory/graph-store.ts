import fs from 'fs/promises';
import { tokenizeNormalized } from '@agentos/lang/string';
import { BaseNode, Edge, EdgeType, EmbeddingProvider, GraphConfig, NodeGeneration } from './types';
import { SimpleEmbedding, SparseVec } from './embedding/simple-embedding';
import { cosineSparse } from './utils/cosine-sparse';
import { canonicalKey, defaultCanonicalMeta } from './utils/canonical-key';
import { serializeSparse, deserializeSparse } from './utils/serialize-sparse';
import { canonicalTagKey } from './utils/tag-key';

export class GraphStore {
  private nodes = new Map<string, BaseNode>();
  private edges = new Map<string, Edge>();
  private byCanonical = new Map<string, string>();
  private inverted?: Map<string, Set<string>>;
  private dirty = false;
  private generationIndex: Record<NodeGeneration, Set<string>> = {
    young: new Set(),
    old: new Set(),
  };

  constructor(
    private cfg: GraphConfig,
    private embedder: EmbeddingProvider = new SimpleEmbedding()
  ) {
    if (cfg.enableInvertedIndex) {
      this.inverted = new Map();
    }
  }

  private indexNode(id: string, text?: string, canonical?: string) {
    if (canonical) {
      this.byCanonical.set(canonical, id);
    }
    if (!this.inverted || !text) {
      return;
    }
    const grams = tokenizeNormalized(text);
    for (const g of grams) {
      if (!g) {
        continue;
      }
      const set = this.inverted.get(g) ?? new Set();
      set.add(id);
      this.inverted.set(g, set);
    }
  }

  private unindexNode(id: string, text?: string, canonical?: string) {
    if (canonical && this.byCanonical.get(canonical) === id) {
      this.byCanonical.delete(canonical);
    }
    if (!this.inverted || !text) {
      return;
    }
    const grams = tokenizeNormalized(text);
    for (const g of grams) {
      if (!g) {
        continue;
      }
      const set = this.inverted.get(g);
      if (!set) {
        continue;
      }
      set.delete(id);
      if (set.size === 0) {
        this.inverted.delete(g);
      } else {
        this.inverted.set(g, set);
      }
    }
  }

  private trackGeneration(node: BaseNode) {
    this.generationIndex[node.generation].add(node.id);
  }

  private untrackGeneration(node: BaseNode) {
    this.generationIndex[node.generation].delete(node.id);
  }

  private setGeneration(node: BaseNode, next: NodeGeneration, updatedAt: number) {
    if (node.generation === next) {
      node.generationUpdatedAt = updatedAt;
      return;
    }
    this.untrackGeneration(node);
    node.generation = next;
    node.generationUpdatedAt = updatedAt;
    this.trackGeneration(node);
  }

  upsertQuery(text: string) {
    const now = Date.now();
    const emb = this.embedder.embed(text) as SparseVec;
    const ck = canonicalKey(text);
    const existing = this.byCanonical.get(ck);
    if (existing) {
      const q = this.nodes.get(existing)!;
      q.weights.repeat += 1;
      q.lastAccess = now;
      this.touchNeighbors(existing, now);
      this.evictIfNeeded();
      return q.id;
    }
    const cand: { id: string; sim: number }[] = [];
    for (const n of this.nodes.values()) {
      if (n.type !== 'query' || !n.embedding) {
        continue;
      }
      const sim = cosineSparse(emb, n.embedding as SparseVec);
      cand.push({ id: n.id, sim });
    }
    cand.sort((a, b) => b.sim - a.sim);
    const best = cand[0];
    if (best && best.sim >= this.cfg.tauDup) {
      const q = this.nodes.get(best.id)!;
      q.weights.repeat += 1;
      q.lastAccess = now;
      this.touchNeighbors(q.id, now);
      this.evictIfNeeded();
      return q.id;
    }
    const id = `q_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const q: BaseNode = {
      id,
      type: 'query',
      text,
      canonicalKey: ck,
      embedding: emb,
      createdAt: now,
      lastAccess: now,
      degree: 0,
      weights: { repeat: 0, feedback: 0 },
      generation: 'young',
      generationUpdatedAt: now,
    };
    this.nodes.set(id, q);
    this.indexNode(id, text, ck);
    this.trackGeneration(q);
    for (const c of cand.slice(0, 10)) {
      if (c.sim >= this.cfg.tauSim) {
        this.link(id, c.id, 'similar_to', c.sim);
        this.bump(id, +0.3);
        this.bump(c.id, +0.3);
      }
    }
    this.dirty = true;
    this.evictIfNeeded();
    return id;
  }

  upsertTag(tag: string, opts?: { generation?: NodeGeneration; carryWeights?: boolean }) {
    const now = Date.now();
    const canonical = canonicalTagKey(tag);
    const existing = this.byCanonical.get(canonical);
    if (existing) {
      const node = this.nodes.get(existing);
      if (node) {
        const targetGeneration = opts?.generation ?? node.generation;
        this.setGeneration(node, targetGeneration, now);
        node.lastAccess = Math.max(node.lastAccess, now);
        if (opts?.carryWeights) {
          node.weights.repeat += 0.2;
        } else {
          node.weights.repeat += 0.05;
        }
        this.dirty = true;
        return { id: node.id, created: false };
      }
    }
    const id = `tag_${now}_${Math.random().toString(36).slice(2, 8)}`;
    const node: BaseNode = {
      id,
      type: 'entity',
      text: tag,
      canonicalKey: canonical,
      createdAt: now,
      lastAccess: now,
      degree: 0,
      weights: { repeat: 0, feedback: 0 },
      generation: opts?.generation ?? 'young',
      generationUpdatedAt: now,
    };
    this.nodes.set(id, node);
    this.indexNode(id, tag, canonical);
    this.trackGeneration(node);
    this.dirty = true;
    return { id, created: true };
  }

  recordFeedback(targetQueryId: string, label: 'up' | 'down' | 'retry', note?: string) {
    const now = Date.now();
    const id = `f_${now}_${Math.random().toString(36).slice(2, 6)}`;
    const f: BaseNode = {
      id,
      type: 'feedback',
      text: `feedback:${label}${note ? ' ' + note : ''}`,
      createdAt: now,
      lastAccess: now,
      degree: 0,
      weights: { repeat: 0, feedback: 0 },
      generation: 'young',
      generationUpdatedAt: now,
    };
    this.nodes.set(id, f);
    this.trackGeneration(f);
    this.link(targetQueryId, id, 'has_feedback', 1.0);
    if (label === 'up') {
      this.bump(targetQueryId, +1.0);
    }
    if (label === 'down') {
      this.bump(targetQueryId, -1.0);
    }
    if (label === 'retry') {
      this.bump(targetQueryId, -0.5);
    }
    this.dirty = true;
    this.evictIfNeeded();
    return id;
  }

  adjustWeights(nodeId: string, deltas: { feedbackDelta?: number; repeatDelta?: number }) {
    const n = this.nodes.get(nodeId);
    if (!n) {
      return;
    }
    if (deltas.feedbackDelta) {
      n.weights.feedback += deltas.feedbackDelta;
    }
    if (deltas.repeatDelta) {
      n.weights.repeat += deltas.repeatDelta;
    }
    n.lastAccess = Date.now();
    this.dirty = true;
  }

  getNode(id: string) {
    return this.nodes.get(id);
  }

  listNodes() {
    return [...this.nodes.values()].map((n) => ({ ...n }));
  }

  promoteGeneration(id: string, target: NodeGeneration = 'old', opts?: { touchedAt?: number }) {
    const node = this.nodes.get(id);
    if (!node) {
      return false;
    }
    const at = opts?.touchedAt ?? Date.now();
    this.setGeneration(node, target, at);
    node.lastAccess = Math.max(node.lastAccess, at);
    this.dirty = true;
    return true;
  }

  detachNode(id: string) {
    const node = this.nodes.get(id);
    if (!node) {
      return undefined;
    }
    for (const e of [...this.edges.values()]) {
      if (e.from === id || e.to === id) {
        this.removeEdge(e.id);
      }
    }
    this.nodes.delete(id);
    this.unindexNode(id, node.text, node.canonicalKey);
    this.untrackGeneration(node);
    node.degree = 0;
    this.dirty = true;
    return node;
  }

  adoptNode(node: BaseNode, opts?: { generation?: NodeGeneration; carryWeights?: boolean }) {
    const now = Date.now();
    const targetGeneration = opts?.generation ?? 'old';
    const canonicalId = node.canonicalKey ? this.byCanonical.get(node.canonicalKey) : undefined;
    if (canonicalId) {
      const existing = this.nodes.get(canonicalId);
      if (existing) {
        if (opts?.carryWeights) {
          const delta = (node.weights?.feedback ?? 0) + (node.weights?.repeat ?? 0) * 0.2;
          this.adjustWeights(existing.id, { feedbackDelta: delta });
        }
        existing.lastAccess = Math.max(existing.lastAccess, node.lastAccess, now);
        this.setGeneration(existing, targetGeneration, now);
        this.dirty = true;
        return { id: existing.id, merged: true };
      }
    }
    if (this.nodes.has(node.id)) {
      throw new Error(`Cannot adopt node ${node.id}; id already exists in target store`);
    }
    this.setGeneration(node, targetGeneration, now);
    node.lastAccess = Math.max(node.lastAccess, now);
    this.nodes.set(node.id, node);
    this.indexNode(node.id, node.text, node.canonicalKey);
    this.dirty = true;
    return { id: node.id, merged: false };
  }

  link(from: string, to: string, type: EdgeType, weight: number) {
    const now = Date.now();
    if (!this.nodes.has(from) || !this.nodes.has(to)) {
      return;
    }
    const key = `${from}::${type}::${to}`;
    const prev = this.edges.get(key);
    const e: Edge = {
      id: key,
      from,
      to,
      type,
      weight: (prev?.weight ?? 0) + weight,
      createdAt: prev?.createdAt ?? now,
      lastAccess: now,
    };
    if (!prev) {
      const a = this.nodes.get(from)!;
      a.degree++;
      a.lastAccess = now;
      const b = this.nodes.get(to)!;
      b.degree++;
      b.lastAccess = now;
    }
    this.edges.set(key, e);
  }

  linkTagToQuery(tagId: string, queryId: string, weight = 1) {
    const tag = this.nodes.get(tagId);
    const query = this.nodes.get(queryId);
    if (!tag || !query) {
      return;
    }
    if (tag.type !== 'entity' || query.type !== 'query') {
      return;
    }
    this.link(queryId, tagId, 'refers_to_entity', weight);
  }

  searchSimilarQueries(text: string, k = 5) {
    const emb = this.embedder.embed(text) as SparseVec;
    const out: { id: string; sim: number; score: number; text?: string; canonicalKey?: string }[] =
      [];
    const ids = new Set<string>();
    if (this.inverted) {
      const grams = tokenizeNormalized(text);
      for (const g of grams) {
        for (const id of this.inverted.get(g) ?? []) {
          ids.add(id);
        }
      }
    } else {
      for (const id of this.nodes.keys()) {
        ids.add(id);
      }
    }
    for (const id of ids) {
      const n = this.nodes.get(id)!;
      if (n.type !== 'query' || !n.embedding) {
        continue;
      }
      const sim = cosineSparse(emb, n.embedding as SparseVec);
      const score = 0.7 * sim + 0.3 * this.rank(n);
      out.push({ id, sim, score, text: n.text, canonicalKey: n.canonicalKey });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, k);
  }

  private bump(nodeId: string, delta: number) {
    const n = this.nodes.get(nodeId);
    if (!n) {
      return;
    }
    n.weights.feedback += delta;
    n.lastAccess = Date.now();
  }

  getEdges(filter: { from?: string; to?: string; type?: EdgeType }) {
    return [...this.edges.values()]
      .filter(
        (e) =>
          (filter.from ? e.from === filter.from : true) &&
          (filter.to ? e.to === filter.to : true) &&
          (filter.type ? e.type === filter.type : true)
      )
      .map((e) => ({ ...e }));
  }

  private touchNeighbors(nodeId: string, ts: number) {
    for (const e of this.edges.values()) {
      if (e.from === nodeId || e.to === nodeId) {
        e.lastAccess = ts;
      }
    }
  }
  private rank(n: BaseNode) {
    const now = Date.now();
    const ageMin = (now - n.lastAccess) / (1000 * 60);
    const recency = Math.exp(-Math.log(2) * (ageMin / this.cfg.halfLifeMin));
    const repeat = Math.tanh((n.weights.repeat ?? 0) / 5);
    const fb = Math.tanh((n.weights.feedback ?? 0) / 5);
    const gen = n.generation === 'old' ? 0.1 : 0;
    return 0.4 * recency + 0.3 * repeat + 0.2 * fb + gen;
  }
  private evictIfNeeded() {
    const { maxNodes, maxEdges, protectMinDegree } = this.cfg;
    const overN = this.nodes.size - maxNodes;
    if (overN > 0) {
      const young: BaseNode[] = [];
      const old: BaseNode[] = [];
      for (const n of this.nodes.values()) {
        if (n.pinned) {
          continue;
        }
        if ((n.degree ?? 0) >= protectMinDegree) {
          continue;
        }
        if (n.generation === 'old') {
          old.push(n);
        } else {
          young.push(n);
        }
      }
      const pickOrder = [
        ...young.sort((a, b) => this.rank(a) - this.rank(b)),
        ...old.sort((a, b) => this.rank(a) - this.rank(b)),
      ];
      for (let i = 0; i < overN && i < pickOrder.length; i++) {
        this.removeNode(pickOrder[i].id);
      }
    }
    const overE = this.edges.size - maxEdges;
    if (overE > 0) {
      const es = [...this.edges.values()].sort(
        (a, b) => a.weight - b.weight || a.lastAccess - b.lastAccess
      );
      for (let i = 0; i < overE && i < es.length; i++) {
        this.removeEdge(es[i].id);
      }
    }
  }
  private removeNode(id: string) {
    this.detachNode(id);
  }
  private removeEdge(id: string) {
    const e = this.edges.get(id);
    if (!e) {
      return;
    }
    const a = this.nodes.get(e.from);
    if (a) {
      a.degree = Math.max(0, a.degree - 1);
    }
    const b = this.nodes.get(e.to);
    if (b) {
      b.degree = Math.max(0, b.degree - 1);
    }
    this.edges.delete(id);
  }

  stats() {
    return {
      nodes: this.nodes.size,
      edges: this.edges.size,
      generations: {
        young: this.generationIndex.young.size,
        old: this.generationIndex.old.size,
      },
    };
  }

  toSnapshot() {
    const nodes = [...this.nodes.values()].map((n) => ({
      ...n,
      embedding: serializeSparse(n.embedding),
    }));
    const edges = [...this.edges.values()];
    const embedder = this.embedder.exportState?.() ?? null;
    return { graph: { nodes, edges }, embedder, canonicalMeta: defaultCanonicalMeta };
  }
  fromSnapshot(s: {
    graph: {
      nodes: Array<{ id: string; embedding: unknown; [k: string]: unknown }>;
      edges: Edge[];
    };
    embedder?: unknown;
  }) {
    this.nodes.clear();
    this.edges.clear();
    this.byCanonical.clear();
    this.generationIndex.young.clear();
    this.generationIndex.old.clear();
    if (this.inverted) {
      this.inverted.clear();
    }
    for (const raw of s.graph.nodes) {
      const n = {
        ...(raw as Record<string, unknown>),
        embedding: deserializeSparse(raw.embedding),
      } as BaseNode;
      if (!('generation' in n)) {
        n.generation = 'young';
      }
      if (typeof n.generationUpdatedAt !== 'number' || Number.isNaN(n.generationUpdatedAt)) {
        n.generationUpdatedAt = typeof n.lastAccess === 'number' ? n.lastAccess : n.createdAt;
      }
      this.nodes.set(n.id, n);
      this.indexNode(n.id, n.text, n.canonicalKey);
      this.trackGeneration(n);
    }
    for (const e of s.graph.edges) {
      this.edges.set(e.id, e);
    }
    this.embedder.importState?.(s.embedder);
  }
  async saveToFile(file: string, opts?: { onlyIfDirty?: boolean }) {
    if (opts?.onlyIfDirty && !this.dirty) {
      return;
    }
    await fs.writeFile(file, JSON.stringify(this.toSnapshot()), 'utf8');
    this.dirty = false;
  }
  static async loadFromFile(file: string, store: GraphStore) {
    const json = await fs.readFile(file, 'utf8');
    store.fromSnapshot(JSON.parse(json));
  }
}
