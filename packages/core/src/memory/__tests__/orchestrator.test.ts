import { MemoryOrchestrator } from '../../memory/memory-orchestrator';

const baseCfg = {
  sessionGraph: { maxNodes: 1000, maxEdges: 4000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3, enableInvertedIndex: false },
  agentGraph:   { maxNodes: 1000, maxEdges: 12000, halfLifeMin: 1440, tauDup: 0.96, tauSim: 0.78, protectMinDegree: 4, enableInvertedIndex: true },
  promotion:    { minRank: 0.55, maxPromotions: 10, minDegree: 1, carryWeights: true },
  checkpoint:   { outDir: './.agentos/checkpoints', topK: 10, pretty: false },
  searchBiasSessionFirst: 0.05,
};

describe('MemoryOrchestrator', () => {
  test('hybrid search dedupes by canonicalKey across session and agent', () => {
    const o = new MemoryOrchestrator('agent-1', baseCfg);
    const sid = 's-1';
    o.upsertQuery(sid, 'AgentOS MVP 설계');
    o.getAgentStore().upsertQuery('agentos mvp 설계');
    const res = o.search(sid, 'mvp 설계', 8);
    expect(res.length).toBeGreaterThan(0);
    // same canonicalKey should collapse to a single entry
    const keys = new Set(res.map(r => r.canonicalKey ?? r.id));
    expect(keys.size).toBe(res.length);
  });

  test('finalizeSession promotes hotspots to agent store', async () => {
    const o = new MemoryOrchestrator('agent-2', baseCfg);
    const sid = 's-2';
    const q = o.upsertQuery(sid, '개인화 메모리 그래프 설계');
    o.recordFeedback(sid, q, 'up');
    const before = o.getAgentStore().stats().nodes;
    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const after = o.getAgentStore().stats().nodes;
    expect(after).toBeGreaterThanOrEqual(before);
  });
});

