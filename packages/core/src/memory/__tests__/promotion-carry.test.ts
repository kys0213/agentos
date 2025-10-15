import { MemoryOrchestrator } from '../../memory/memory-orchestrator';

const cfg = {
  sessionGraph: {
    maxNodes: 1000,
    maxEdges: 4000,
    halfLifeMin: 240,
    tauDup: 0.96,
    tauSim: 0.75,
    protectMinDegree: 3,
    enableInvertedIndex: false,
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
  promotion: { minRank: 0.45, maxPromotions: 10, minDegree: 0, carryWeights: true },
  checkpoint: { outDir: './.agentos/checkpoints', topK: 10, pretty: false },
  searchBiasSessionFirst: 0.05,
};

describe('Promotion carries weights into agent store', () => {
  test('feedback-heavy node yields higher agent score', async () => {
    const o = new MemoryOrchestrator('qa-carry', cfg);
    const sid = 's-carry';
    const text = '제품B 회귀 테스트 실행';
    // Boost feedback and repeat
    const q = o.upsertQuery(sid, text);
    for (let i = 0; i < 5; i++) {
      o.recordFeedback(sid, q, 'up');
    }
    for (let i = 0; i < 3; i++) {
      o.upsertQuery(sid, text);
    }

    const before = o.getAgentStore().searchSimilarQueries(text, 3);
    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const after = o.getAgentStore().searchSimilarQueries(text, 3);
    expect(after.length).toBeGreaterThan(0);
    // Score improvement expected after carryWeights
    expect(after[0].score ?? 0).toBeGreaterThanOrEqual(before[0]?.score ?? 0);
    const adopted = o.getAgentStore().getNode(q);
    expect(adopted?.weights.feedback ?? 0).toBeGreaterThan(0);
    expect(adopted?.generation).toBe('old');
  });
});
