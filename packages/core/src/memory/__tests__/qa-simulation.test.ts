import { MemoryOrchestrator } from '../../memory/memory-orchestrator';

const cfg = {
  sessionGraph: { maxNodes: 1000, maxEdges: 4000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3, enableInvertedIndex: false },
  agentGraph:   { maxNodes: 1000, maxEdges: 12000, halfLifeMin: 1440, tauDup: 0.96, tauSim: 0.78, protectMinDegree: 4, enableInvertedIndex: true },
  promotion:    { minRank: 0.55, maxPromotions: 30, minDegree: 1, carryWeights: true },
  checkpoint:   { outDir: './.agentos/checkpoints', topK: 30, pretty: false },
  searchBiasSessionFirst: 0.05,
};

function repeat<T>(arr: T[], times = 1): T[] {
  const out: T[] = [];
  for (let i=0; i<times; i++) out.push(...arr);
  return out;
}

describe('QA agent scenario simulation', () => {
  test('builds a meaningful graph and promotions work', async () => {
    const o = new MemoryOrchestrator('qa-agent', cfg);
    const sid = 's-qa-1';

    // 1) QA가 에이전트를 활용하는 자동화 작업
    const authoring = [
      '테스트 케이스 작성', '테스트케이스 작성', '테스트 시나리오 작성',
      '제품A 로그인 테스트 케이스 작성', '제품B 결제 테스트 케이스 생성',
      '테스트케이스 템플릿 생성', '테스트 케이스 초안 만들기',
    ];
    const regression = [
      '리그레이션 테스트 수행', '회귀 테스트 실행', '리그레션 테스트 수행',
      '제품B 회귀 테스트 실행', '제품B 리그레이션 테스트 수행',
    ];
    const retrieval = [
      '작성된 테스트케이스 조회', '테스트케이스 목록 조회', '테스트 케이스 검색',
      '제품A 테스트케이스 검색', '제품B 테스트케이스 조회',
    ];

    // 2) 테스트 증적 검증 케이스
    const evidence = [
      '테스트 증적 검증 요청', '시험 증적 확인', '테스트 결과 증빙 확인',
      '제품A 테스트 증적 검토', '제품B 테스트 증적 확인',
    ];

    // 3) 테스트케이스 검색 질의
    const search = [
      '제품A 개편 테스트케이스 있어?', '제품A 리뉴얼 관련 테스트 케이스',
      '제품B 리팩토링 리그레이션 필요', '제품B 리팩토링 회귀 테스트 계획',
      '제품A 신규 기능 회귀 테스트 필요?',
    ];

    const dataset = [
      ...repeat(authoring, 3),
      ...repeat(regression, 3),
      ...repeat(retrieval, 2),
      ...repeat(evidence, 2),
      ...repeat(search, 2),
    ];

    // 업서트 & 일부 피드백(+ 유사군 형성 유도)
    const ids: string[] = [];
    for (const q of dataset) {
      const id = o.upsertQuery(sid, q);
      ids.push(id);
      if (q.includes('작성') || q.includes('생성')) o.recordFeedback(sid, id, 'up');
      if (q.includes('리팩토링')) o.recordFeedback(sid, id, 'retry');
      if (q.includes('증적')) o.recordFeedback(sid, id, 'up');
    }

    // 그래프 상태 검증(세션)
    const sessionStats = o.getSessionStore(sid).stats();
    expect(sessionStats.nodes).toBeGreaterThan(20); // 중복 병합 후에도 의미 있는 노드 수
    expect(sessionStats.edges).toBeGreaterThan(10); // 유사/피드백 엣지 생성

    // 유사 검색 검증(세션): paraphrase 결과가 상위권에 등장
    const sRes = o.search(sid, '리그레이션 테스트 실행', 8);
    expect(sRes.length).toBeGreaterThan(0);
    // canonicalKey 기준 중복 제거가 적용되어 있어야 함
    const ckSet = new Set(sRes.map(r => r.canonicalKey ?? r.id));
    expect(ckSet.size).toBe(sRes.length);

    // 세션 종료 → 승격 + 체크포인트
    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const agentStats = o.getAgentStore().stats();
    expect(agentStats.nodes).toBeGreaterThan(0);

    // 에이전트 스토어에서 검색(세션 종료 이후)
    const aRes = o.getAgentStore().searchSimilarQueries('제품A 테스트케이스', 8);
    expect(aRes.length).toBeGreaterThan(0);
  });
});

