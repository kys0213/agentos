import path from 'path';
import fs from 'fs/promises';
import {
  GraphStore,
  SleepCycleBaseOptions,
  SleepCycleReport,
  SleepCycleRunOptions,
  SleepCycleSummarizer,
} from './graph-store';
import { GraphConfig, BaseNode, Edge } from './types';
import { SimpleEmbedding } from './embedding/simple-embedding';

export type Scope = 'agent' | 'session';

export interface OrchestratorCfg {
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

export class MemoryOrchestrator {
  private embedder = new SimpleEmbedding();
  private agentStore: GraphStore;
  private sessions = new Map<string, GraphStore>();

  constructor(
    private agentId: string,
    private cfg: OrchestratorCfg
  ) {
    this.agentStore = new GraphStore({ ...cfg.agentGraph }, this.embedder);
    this.configureSleepCycle(this.agentStore, 'agent');
  }

  getSessionStore(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      const store = new GraphStore({ ...this.cfg.sessionGraph }, this.embedder);
      this.configureSleepCycle(store, 'session');
      this.sessions.set(sessionId, store);
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
    return this.getSessionStore(sessionId).upsertQuery(text);
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

  private configureSleepCycle(store: GraphStore, scope: Scope) {
    if (!this.cfg.sleepCycle) {
      return;
    }
    store.configureSleepCycle({
      summarizer: this.cfg.sleepCycle.summarizer,
      defaults: this.cfg.sleepCycle.defaults,
      emit: this.cfg.sleepCycle.emit
        ? (report) => this.cfg.sleepCycle?.emit?.(scope, report)
        : undefined,
    });
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

    if (this.cfg.sleepCycle && this.cfg.sleepCycle.runOnFinalize !== false) {
      const overrides: SleepCycleRunOptions = {
        ...(this.cfg.sleepCycle.runOptions ?? {}),
        trigger: 'session-finalize',
        force: true,
      };
      s.runSleepCycle(overrides);
    }

    if (promote) {
      const promoted = this.promoteHotspotsFromSession(sessionId, {
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
  }

  promoteHotspotsFromSession(sessionId: string, opts?: { carryWeights?: boolean }) {
    const s = this.sessions.get(sessionId);
    if (!s) {
      return 0;
    }
    const snap = s.toSnapshot();
    const top = this.pickTopQueries(
      this.normalizeNodes(
        snap.graph.nodes as Array<Omit<BaseNode, 'embedding'> & { embedding: unknown }>
      ),
      this.cfg.promotion.minRank,
      this.cfg.promotion.maxPromotions,
      this.cfg.promotion.minDegree ?? 0,
      this.cfg.sessionGraph.halfLifeMin
    );
    let count = 0;
    for (const n of top) {
      if (n.type !== 'query' || !n.text) {
        continue;
      }
      const id = this.agentStore.upsertQuery(n.text);
      if (opts?.carryWeights) {
        const delta = (n.weights?.feedback ?? 0) + (n.weights?.repeat ?? 0) * 0.2;
        this.agentStore.adjustWeights(id, { feedbackDelta: delta });
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
      return { ...n, embedding } as BaseNode;
    });
  }
}
