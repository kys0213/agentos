import { MemoryOrchestrator } from '../../memory/memory-orchestrator';

const cfg = {
  sessionGraph: { maxNodes: 1000, maxEdges: 12000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3, enableInvertedIndex: true },
  agentGraph:   { maxNodes: 1000, maxEdges: 12000, halfLifeMin: 1440, tauDup: 0.96, tauSim: 0.78, protectMinDegree: 4, enableInvertedIndex: true },
  promotion:    { minRank: 0.55, maxPromotions: 40, minDegree: 1, carryWeights: true },
  checkpoint:   { outDir: './.agentos/checkpoints', topK: 40, pretty: false },
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
    for (const fn of authoring) out.push(fn(p));
    for (const fn of regression) out.push(fn(p));
    for (const fn of retrieval) out.push(fn(p));
    for (const fn of evidence) out.push(fn(p));
    for (const fn of search) out.push(fn(p));
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
  return Array(3).fill(0).flatMap(() => out);
}

describe('QA agent large simulation (~100 queries)', () => {
  test('graph forms clusters and promotions carry weights [snapshot]', async () => {
    const o = new MemoryOrchestrator('qa-agent-large', cfg);
    const sid = 's-qa-large';
    const dataset = buildDataset().slice(0, 100);

    for (const q of dataset) {
      const id = o.upsertQuery(sid, q);
      if (q.includes('작성') || q.includes('생성')) o.recordFeedback(sid, id, 'up');
      if (q.includes('리팩토링')) o.recordFeedback(sid, id, 'retry');
      if (q.includes('증적')) o.recordFeedback(sid, id, 'up');
    }

    const sStore = o.getSessionStore(sid);
    const sStats = sStore.stats();
    expect(sStats.nodes).toBeGreaterThan(30);
    expect(sStats.edges).toBeGreaterThan(20);

    // Snapshot summary (cluster-ish signals via similar_to counts)
    const snap = sStore.toSnapshot();
    const typeCounts = snap.graph.edges.reduce((acc: any, e: any) => {
      acc[e.type] = (acc[e.type] ?? 0) + 1; return acc;
    }, {} as Record<string, number>);
    const topTexts = snap.graph.nodes
      .filter((n: any) => n.type === 'query')
      .sort((a: any, b: any) => (b.weights?.feedback ?? 0) - (a.weights?.feedback ?? 0))
      .slice(0, 10)
      .map((n: any) => ({ text: n.text, fb: Number((n.weights?.feedback ?? 0).toFixed(2)), degree: n.degree }));
    expect({ sStats, typeCounts, topTexts }).toMatchSnapshot();

    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const aStore = o.getAgentStore();
    const aStats = aStore.stats();
    expect(aStats.nodes).toBeGreaterThan(0);

    const res = aStore.searchSimilarQueries('제품C 리그레이션 테스트', 10)
      .map(r => ({ text: r.text, score: Number(r.score.toFixed(2)) }))
      .sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    expect({ aStats, res }).toMatchSnapshot();
  });
});

