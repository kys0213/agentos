import { GraphStore } from '../../memory/graph-store';
import { SimpleEmbedding } from '../../memory/embedding/simple-embedding';

const cfg = {
  maxNodes: 1000,
  maxEdges: 4000,
  halfLifeMin: 240,
  tauDup: 0.96,
  tauSim: 0.75,
  protectMinDegree: 3,
  enableInvertedIndex: false,
};

describe('GraphStore', () => {
  test('upsertQuery deduplicates by canonicalKey (exact duplicate under normalization)', () => {
    const g = new GraphStore(cfg, new SimpleEmbedding());
    const a = g.upsertQuery('AgentOS MVP 설계');
    const b = g.upsertQuery('agentos mvp 설계'); // normalization -> same canonicalKey
    expect(b).toBe(a);
    expect(g.stats().nodes).toBe(1);
  });

  test('snapshot round-trip preserves searchable results', () => {
    const g1 = new GraphStore(cfg, new SimpleEmbedding());
    const q1 = g1.upsertQuery('에이전트 메모리 그래프 설계');
    g1.recordFeedback(q1, 'up', '좋아');
    const snap = g1.toSnapshot();

    const g2 = new GraphStore(cfg, new SimpleEmbedding());
    g2.fromSnapshot(snap);
    const before = g1.searchSimilarQueries('메모리 그래프 설계', 3);
    const after = g2.searchSimilarQueries('메모리 그래프 설계', 3);
    expect(after.length).toBeGreaterThan(0);
    // Compare top canonicalKey/text identity
    expect(after[0].canonicalKey).toBe(before[0].canonicalKey);
    expect(after[0].text).toBe(before[0].text);
  });

  test('graph snapshot structure is stable (sanitized) [snapshot]', () => {
    const g = new GraphStore(cfg, new SimpleEmbedding());
    const texts = [
      '테스트 케이스 작성',
      '테스트케이스 작성',
      '리그레이션 테스트 수행',
      '작성된 테스트케이스 조회',
      '제품A 테스트케이스 검색',
      '제품B 리팩토링 회귀 테스트 계획',
    ];
    for (const t of texts) {
      const id = g.upsertQuery(t);
      if (t.includes('작성')) {
        g.recordFeedback(id, 'up');
      }
    }
    const snap = g.toSnapshot();
    type RawNode = {
      type?: string;
      text?: string;
      canonicalKey?: string;
      degree?: number;
      weights?: { repeat?: number; feedback?: number };
    };
    const nodes = (snap.graph.nodes as RawNode[])
      .filter((n) => n.type === 'query')
      .map((n) => ({
        text: n.text,
        canonicalKey: n.canonicalKey,
        degree: n.degree,
        weights: {
          repeat: Number((n.weights?.repeat ?? 0).toFixed(2)),
          feedback: Number((n.weights?.feedback ?? 0).toFixed(2)),
        },
      }))
      .sort((a, b) => String(a.text || '').localeCompare(String(b.text || '')));
    const edgeTypeCounts = snap.graph.edges.reduce(
      (acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    expect({ nodes, edgeTypeCounts }).toMatchSnapshot();
  });

  test('sleep cycle consolidates similar queries and preserves canonical metadata', () => {
    const g = new GraphStore(cfg, new SimpleEmbedding());
    g.configureSleepCycle({
      summarizer: {
        summarize(texts, _opts) {
          return texts.join(' / ').slice(0, 120);
        },
      },
      defaults: {
        similarityThreshold: 0.7,
        minRank: 1,
        maxClusters: 4,
        minClusterSize: 2,
        cooldownMs: 0,
      },
    });

    const base = g.upsertQuery('수면 주기 정리 루틴 설계');
    const similar = g.upsertQuery('수면주기 정리 루틴 설계 구체화');
    const distinct = g.upsertQuery('테스트 케이스 문서화 전략');

    expect(base).not.toBe(similar);
    expect(base).not.toBe(distinct);

    g.link(base, similar, 'similar_to', 0.92);

    const report = g.runSleepCycle({ trigger: 'interval', force: true });
    expect(report).not.toBeNull();
    expect(report?.freedCapacity).toBeGreaterThanOrEqual(1);
    expect(report?.clusters.length).toBeGreaterThan(0);

    const snap = g.toSnapshot();
    const queries = (snap.graph.nodes as Array<Record<string, unknown>>).filter(
      (n) => n.type === 'query'
    );
    const consolidated = queries.find(
      (n) => Array.isArray(n.sourceNodeIds) && (n.sourceNodeIds as string[]).length >= 2
    );
    expect(consolidated).toBeTruthy();
    expect(consolidated?.summary).toContain('수면');
    const ids = new Set((consolidated?.sourceNodeIds as string[]) ?? []);
    expect(ids.has(base)).toBe(true);
    expect(ids.has(similar)).toBe(true);
    expect(ids.has(distinct)).toBe(false);
  });
});
