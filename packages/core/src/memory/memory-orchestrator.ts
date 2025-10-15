import path from 'path';
import fs from 'fs/promises';
import { GraphStore } from './graph-store';
import { GraphConfig, BaseNode, Edge } from './types';
import { SimpleEmbedding } from './embedding/simple-embedding';
import { TagExtractor } from './tag-extractor';

export type Scope = 'agent' | 'session';

export interface OrchestratorCfg {
  sessionGraph: GraphConfig;
  agentGraph: GraphConfig;
  promotion: { minRank: number; maxPromotions: number; minDegree?: number; carryWeights?: boolean };
  checkpoint: { outDir: string; topK: number; pretty?: boolean };
  searchBiasSessionFirst?: number;
  tagging?: {
    window: number;
    maxTagsPerBatch?: number;
    extractor?: TagExtractor;
  };
}

export class MemoryOrchestrator {
  private embedder = new SimpleEmbedding();
  private agentStore: GraphStore;
  private sessions = new Map<string, GraphStore>();
  private tagBuffers = new Map<string, string[]>();
  private tagExtractor?: TagExtractor;
  private pendingTagging = new Map<string, Promise<void>>();

  constructor(
    private agentId: string,
    private cfg: OrchestratorCfg
  ) {
    this.agentStore = new GraphStore({ ...cfg.agentGraph }, this.embedder);
    if (cfg.tagging) {
      this.tagExtractor = cfg.tagging.extractor;
    }
  }

  getSessionStore(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new GraphStore({ ...this.cfg.sessionGraph }, this.embedder));
    }
    return this.sessions.get(sessionId)!;
  }
  getAgentStore() {
    return this.agentStore;
  }
  getActiveSessions() {
    return [...this.sessions.keys()];
  }

  upsertQuery(sessionId: string, text: string) {
    const id = this.getSessionStore(sessionId).upsertQuery(text);
    this.trackQueryForTagging(sessionId, id);
    return id;
  }
  recordFeedback(sessionId: string, qId: string, label: 'up' | 'down' | 'retry', note?: string) {
    return this.getSessionStore(sessionId).recordFeedback(qId, label, note);
  }

  search(sessionId: string, text: string, k = 8) {
    const s = this.getSessionStore(sessionId);
    const sTop = s.searchSimilarQueries(text, k);
    const aTop = this.agentStore.searchSimilarQueries(text, k);
    const bias = this.cfg.searchBiasSessionFirst ?? 0.05;
    const map = new Map<
      string,
      { id: string; score: number; from: 'session' | 'agent'; text?: string; canonicalKey?: string }
    >();
    for (const r of sTop) {
      map.set(r.canonicalKey ?? r.id, {
        id: r.id,
        score: r.score + bias,
        from: 'session',
        text: r.text,
        canonicalKey: r.canonicalKey,
      });
    }
    for (const r of aTop) {
      const key = r.canonicalKey ?? r.id;
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          id: r.id,
          score: r.score,
          from: 'agent',
          text: r.text,
          canonicalKey: r.canonicalKey,
        });
      } else {
        cur.score = Math.max(cur.score, r.score + bias);
      }
    }
    return [...map.values()].sort((a, b) => b.score - a.score).slice(0, k);
  }

  private rank(n: Pick<BaseNode, 'lastAccess' | 'weights'>, halfLifeMin: number) {
    const now = Date.now();
    const ageMin = (now - n.lastAccess) / (1000 * 60);
    const recency = Math.exp(-Math.log(2) * (ageMin / halfLifeMin));
    const repeat = Math.tanh((n.weights?.repeat ?? 0) / 5);
    const fb = Math.tanh((n.weights?.feedback ?? 0) / 5);
    return 0.5 * recency + 0.3 * repeat + 0.2 * fb;
  }
  private pickTopQueries(
    nodes: BaseNode[],
    minRank: number,
    topK: number,
    minDegree: number,
    halfLifeMin: number
  ) {
    return nodes
      .filter((n) => n.type === 'query')
      .map((n) => ({ n, r: this.rank(n, halfLifeMin) }))
      .filter((x) => x.r >= minRank && (x.n.degree ?? 0) >= minDegree)
      .sort((a, b) => b.r - a.r)
      .slice(0, topK)
      .map((x) => x.n);
  }
  private cpFile(name: string) {
    return path.join(this.cfg.checkpoint.outDir, name);
  }

  async finalizeSession(
    sessionId: string,
    opts?: { promote?: boolean; checkpoint?: boolean; checkpointName?: string }
  ) {
    const promote = opts?.promote ?? true;
    const checkpoint = opts?.checkpoint ?? true;
    const s = this.sessions.get(sessionId);
    if (!s) {
      return;
    }

    if (this.cfg.tagging) {
      const pending = this.tagBuffers.get(sessionId);
      if (pending?.length) {
        this.scheduleTagGeneration(sessionId, [...pending]);
        pending.length = 0;
      }
    }

    await this.flushTagging(sessionId);

    if (promote) {
      const promoted = await this.promoteHotspotsFromSession(sessionId, {
        carryWeights: this.cfg.promotion.carryWeights,
      });
      if (promoted > 0) {
        await fs.mkdir(this.cfg.checkpoint.outDir, { recursive: true });
        await this.agentStore.saveToFile(this.cpFile(`agent-${this.agentId}.json`), {
          onlyIfDirty: true,
        });
      }
    }

    if (checkpoint) {
      const snap = s.toSnapshot();
      const top = this.pickTopQueries(
        this.normalizeNodes(
          snap.graph.nodes as Array<Omit<BaseNode, 'embedding'> & { embedding: unknown }>
        ),
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
        topQueries: top.map((q) => ({
          id: q.id,
          text: q.text,
          lastAccess: q.lastAccess,
          weights: q.weights,
          degree: q.degree,
          canonicalKey: q.canonicalKey,
        })),
        edges: (snap.graph.edges as Edge[])
          .filter((e) => top.some((q) => q.id === e.from || q.id === e.to))
          .map((e) => ({ from: e.from, to: e.to, type: e.type, weight: e.weight })),
        embedder: snap.embedder,
        canonicalMeta: snap.canonicalMeta,
      };
      await fs.mkdir(this.cfg.checkpoint.outDir, { recursive: true });
      const name =
        opts?.checkpointName ?? `checkpoint-${this.agentId}-${sessionId}-${Date.now()}.json`;
      await fs.writeFile(
        this.cpFile(name),
        JSON.stringify(summary, null, this.cfg.checkpoint.pretty ? 2 : 0),
        'utf8'
      );
    }
    this.sessions.delete(sessionId);
    this.tagBuffers.delete(sessionId);
    this.pendingTagging.delete(sessionId);
  }

  async promoteHotspotsFromSession(sessionId: string, opts?: { carryWeights?: boolean }) {
    const s = this.sessions.get(sessionId);
    if (!s) {
      return 0;
    }

    await this.flushTagging(sessionId);
    const top = this.pickTopQueries(
      s.listNodes(),
      this.cfg.promotion.minRank,
      this.cfg.promotion.maxPromotions,
      this.cfg.promotion.minDegree ?? 0,
      this.cfg.sessionGraph.halfLifeMin
    );
    let count = 0;
    const tagCache = new Map<string, string>();
    for (const n of top) {
      if (n.type !== 'query' || !n.text) {
        continue;
      }
      const tagEdges = s.getEdges({ from: n.id, type: 'refers_to_entity' });
      const detached = s.detachNode(n.id);
      if (!detached) {
        continue;
      }
      const { id } = this.agentStore.adoptNode(detached, {
        generation: 'old',
        carryWeights: opts?.carryWeights,
      });
      this.agentStore.promoteGeneration(id, 'old');
      for (const edge of tagEdges) {
        const tagNode = s.getNode(edge.to);
        if (!tagNode?.text) {
          continue;
        }
        const cached = tagCache.get(tagNode.text);
        let tagId: string | undefined = cached;
        if (!tagId) {
          const { id: adoptedTagId } = this.agentStore.upsertTag(tagNode.text, {
            generation: 'old',
            carryWeights: opts?.carryWeights,
          });
          tagCache.set(tagNode.text, adoptedTagId);
          tagId = adoptedTagId;
        }
        if (tagId) {
          this.agentStore.linkTagToQuery(tagId, id, edge.weight);
        }
      }
      count++;
    }
    return count;
  }

  private normalizeNodes(
    nodes: Array<Omit<BaseNode, 'embedding'> & { embedding: unknown }>
  ): BaseNode[] {
    return nodes.map((n) => {
      const e = (n as { embedding?: unknown }).embedding;
      let embedding: number[] | Map<number, number> | undefined;
      if (e == null) {
        embedding = undefined;
      } else if (Array.isArray(e)) {
        if (e.length === 0 || typeof e[0] === 'number') {
          embedding = e as number[];
        } else {
          try {
            embedding = new Map(e as [number, number][]);
          } catch {
            embedding = undefined;
          }
        }
      } else if (e instanceof Map) {
        embedding = e as Map<number, number>;
      } else {
        embedding = undefined;
      }
      const enriched = { ...n, embedding } as BaseNode;
      if (!enriched.generation) {
        enriched.generation = 'young';
      }
      if (typeof enriched.generationUpdatedAt !== 'number') {
        enriched.generationUpdatedAt = enriched.lastAccess ?? enriched.createdAt;
      }
      return enriched;
    });
  }

  private trackQueryForTagging(sessionId: string, queryId: string) {
    if (!this.tagExtractor || !this.cfg.tagging) {
      return;
    }
    const buf = this.tagBuffers.get(sessionId) ?? [];
    buf.push(queryId);
    if (buf.length >= this.cfg.tagging.window) {
      this.scheduleTagGeneration(sessionId, [...buf]);
      buf.length = 0;
    }
    this.tagBuffers.set(sessionId, buf);
  }

  async waitForTagging(sessionId: string) {
    await this.flushTagging(sessionId);
  }

  private scheduleTagGeneration(sessionId: string, queryIds: string[]) {
    if (!this.tagExtractor || !this.cfg.tagging) {
      return;
    }
    const runner = async () => {
      try {
        await this.generateTagsForBatch(sessionId, queryIds);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`[MemoryOrchestrator] tag generation failed: ${message}`);
      }
    };
    const prev = this.pendingTagging.get(sessionId) ?? Promise.resolve();
    const next = prev.then(runner, runner);
    const wrapped = next.finally(() => {
      const current = this.pendingTagging.get(sessionId);
      if (current === wrapped) {
        this.pendingTagging.delete(sessionId);
      }
    });
    this.pendingTagging.set(sessionId, wrapped);
  }

  private async generateTagsForBatch(sessionId: string, queryIds: string[]) {
    if (!this.tagExtractor || !this.cfg.tagging) {
      return;
    }
    const store = this.getSessionStore(sessionId);
    const nodes = queryIds
      .map((id) => store.getNode(id))
      .filter((n): n is BaseNode => Boolean(n && n.text && n.type === 'query'));
    if (!nodes.length) {
      return;
    }
    const existingTags = store
      .listNodes()
      .filter((n) => n.type === 'entity' && typeof n.text === 'string')
      .map((n) => n.text as string);
    const maxTags = this.cfg.tagging.maxTagsPerBatch ?? 3;
    const tags = await this.tagExtractor.extract({
      texts: nodes.map((n) => n.text ?? ''),
      existing: existingTags,
      maxTags,
    });
    for (const tag of tags) {
      const { id: tagId } = store.upsertTag(tag, { generation: 'young' });
      for (const node of nodes) {
        store.linkTagToQuery(tagId, node.id);
      }
    }
  }

  private async flushTagging(sessionId: string) {
    const pending = this.pendingTagging.get(sessionId);
    if (pending) {
      await pending;
    }
  }
}
