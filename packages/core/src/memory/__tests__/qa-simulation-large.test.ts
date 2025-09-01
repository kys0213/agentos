import { MemoryOrchestrator } from '../../memory/memory-orchestrator';

const cfg = {
  sessionGraph: {
    maxNodes: 1000,
    maxEdges: 12000,
    halfLifeMin: 240,
    tauDup: 0.96,
    tauSim: 0.75,
    protectMinDegree: 3,
    enableInvertedIndex: true,
  },
  agentGraph: {
    maxNodes: 1000,
    maxEdges: 12000,
    halfLifeMin: 1440,
    tauDup: 0.96,
    tauSim: 0.78,
    protectMinDegree: 4,
    enableInvertedIndex: true,
  },
  promotion: { minRank: 0.55, maxPromotions: 40, minDegree: 1, carryWeights: true },
  checkpoint: { outDir: './.agentos/checkpoints', topK: 40, pretty: false },
  searchBiasSessionFirst: 0.05,
};

function buildDataset(): string[] {
  const products = ['제품A', '제품B', '제품C', '제품D'];
  const authoring = [
    (p: string) => `${p} 테스트 케이스 작성`,
    (p: string) => `${p} 테스트케이스 작성`,
    (p: string) => `${p} 테스트 시나리오 작성`,
  ];
  const regression = [
    (p: string) => `${p} 리그레이션 테스트 수행`,
    (p: string) => `${p} 회귀 테스트 실행`,
  ];
  const retrieval = [
    (p: string) => `${p} 작성된 테스트케이스 조회`,
    (p: string) => `${p} 테스트케이스 목록 조회`,
    (p: string) => `${p} 테스트 케이스 검색`,
  ];
  const evidence = [
    (p: string) => `${p} 테스트 증적 검증 요청`,
    (p: string) => `${p} 테스트 결과 증빙 확인`,
  ];
  const search = [
    (p: string) => `${p} 개편 관련 테스트케이스 있어?`,
    (p: string) => `${p} 리팩토링 회귀 테스트 계획`,
  ];

  const out: string[] = [];
  for (const p of products) {
    for (const fn of authoring) {
      out.push(fn(p));
    }
    for (const fn of regression) {
      out.push(fn(p));
    }
    for (const fn of retrieval) {
      out.push(fn(p));
    }
    for (const fn of evidence) {
      out.push(fn(p));
    }
    for (const fn of search) {
      out.push(fn(p));
    }
  }
  // paraphrases without product prefix
  out.push(
    '테스트 케이스 초안 만들기',
    '테스트케이스 템플릿 생성',
    '회귀 테스트 계획 수립',
    '증적 확인 요청',
    '테스트 증적 검토'
  );

  // repeat to reach ~100
  return Array(3)
    .fill(0)
    .flatMap(() => out);
}

describe('QA agent large simulation (~100 queries)', () => {
  test('graph forms clusters and promotions carry weights [snapshot]', async () => {
    // Fix time to ensure deterministic ranks/scores
    let tick = 1_700_000_000_000;
    const nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => (tick += 1000));
    const o = new MemoryOrchestrator('qa-agent-large', cfg);
    const sid = 's-qa-large';
    const dataset = buildDataset().slice(0, 100);

    for (const q of dataset) {
      const id = o.upsertQuery(sid, q);
      if (q.includes('작성') || q.includes('생성')) {
        o.recordFeedback(sid, id, 'up');
      }
      if (q.includes('리팩토링')) {
        o.recordFeedback(sid, id, 'retry');
      }
      if (q.includes('증적')) {
        o.recordFeedback(sid, id, 'up');
      }
    }

    const sStore = o.getSessionStore(sid);
    const sStats = sStore.stats();
    expect(sStats.nodes).toBeGreaterThan(30);
    expect(sStats.edges).toBeGreaterThan(20);

    // Snapshot summary with structural metrics
    const snap = sStore.toSnapshot();
    type RawNode = {
      type?: string;
      id: string;
      text?: string;
      degree?: number;
      weights?: { feedback?: number; repeat?: number };
    };
    const edges = snap.graph.edges;
    const nodes = (snap.graph.nodes as RawNode[]).filter((n) => n.type === 'query');

    const typeCounts = edges.reduce(
      (acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const degreeArr = nodes.map((n) => n.degree ?? 0);
    const fbArr = nodes.map((n) => Number(n.weights?.feedback ?? 0));
    const rpArr = nodes.map((n) => Number(n.weights?.repeat ?? 0));

    const quant = (arr: number[]) => {
      if (arr.length === 0) {
        return { min: 0, max: 0, mean: 0, median: 0, p90: 0 };
      }
      const sorted = [...arr].sort((a, b) => a - b);
      const sum = arr.reduce((a, b) => a + b, 0);
      const mean = sum / arr.length;
      const mid = Math.floor((sorted.length - 1) / 2);
      const median = sorted[mid];
      const p90 = sorted[Math.floor(0.9 * (sorted.length - 1))];
      const round = (x: number) => Number(x.toFixed(2));
      return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean: round(mean),
        median: round(median),
        p90: round(p90),
      };
    };

    // Connected components on similar_to as undirected
    const adj = new Map<string, Set<string>>();
    for (const e of edges) {
      if (e.type === 'similar_to') {
        if (!adj.has(e.from)) {
          adj.set(e.from, new Set());
        }
        if (!adj.has(e.to)) {
          adj.set(e.to, new Set());
        }
        adj.get(e.from)!.add(e.to);
        adj.get(e.to)!.add(e.from);
      }
    }
    const seen = new Set<string>();
    const compSizes: number[] = [];
    const nodeIds = nodes.map((n) => n.id);
    for (const id of nodeIds) {
      if (!seen.has(id)) {
        let size = 0;
        const q = [id];
        seen.add(id);
        while (q.length) {
          const cur = q.pop()!;
          size++;
          for (const nb of adj.get(cur)?.values() ?? []) {
            if (!seen.has(nb)) {
              seen.add(nb);
              q.push(nb as string);
            }
          }
        }
        compSizes.push(size);
      }
    }
    compSizes.sort((a, b) => b - a);

    const metrics = {
      counts: { nodes: sStats.nodes, edges: sStats.edges, queries: nodes.length },
      edgeTypes: typeCounts,
      similarRatio: Number(
        ((typeCounts['similar_to'] ?? 0) / Math.max(1, edges.length)).toFixed(3)
      ),
      degree: quant(degreeArr),
      feedback: quant(fbArr),
      repeat: quant(rpArr),
      components: { count: compSizes.length, top: compSizes.slice(0, 5) },
      topTexts: nodes
        .sort((a, b) => Number(b.weights?.feedback ?? 0) - Number(a.weights?.feedback ?? 0))
        .slice(0, 10)
        .map((n) => ({
          text: n.text,
          fb: Number((n.weights?.feedback ?? 0).toFixed(2)),
          degree: n.degree,
        })),
    };
    expect(metrics).toMatchSnapshot();

    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const aStore = o.getAgentStore();
    const aStats = aStore.stats();
    expect(aStats.nodes).toBeGreaterThan(0);

    const aSnap = aStore.toSnapshot();
    const aEdges = aSnap.graph.edges;
    const aNodes = (aSnap.graph.nodes as RawNode[]).filter((n) => n.type === 'query');
    const aTypeCounts = aEdges.reduce(
      (acc: Record<string, number>, e) => {
        acc[e.type] = (acc[e.type] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
    const aMetrics = {
      counts: { nodes: aStats.nodes, edges: aStats.edges, queries: aNodes.length },
      edgeTypes: aTypeCounts,
      similarRatio: Number(
        ((aTypeCounts['similar_to'] ?? 0) / Math.max(1, aEdges.length)).toFixed(3)
      ),
      topTexts: aNodes
        .sort((a, b) => Number(b.weights?.feedback ?? 0) - Number(a.weights?.feedback ?? 0))
        .slice(0, 10)
        .map((n) => ({
          text: n.text,
          fb: Number((n.weights?.feedback ?? 0).toFixed(2)),
          degree: n.degree,
        })),
      search: aStore
        .searchSimilarQueries('제품C 리그레이션 테스트', 10)
        .map((r) => ({ text: r.text, score: Number(r.score.toFixed(2)) }))
        .sort((a, b) => (a.text || '').localeCompare(b.text || '')),
    };
    expect(aMetrics).toMatchSnapshot();
    nowSpy.mockRestore();
  });
});
