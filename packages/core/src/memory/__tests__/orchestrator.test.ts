import { MemoryOrchestrator } from '../../memory/memory-orchestrator';
import { TagExtractor } from '../../memory/tag-extractor';

const baseCfg = {
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
  promotion: { minRank: 0.55, maxPromotions: 10, minDegree: 1, carryWeights: true },
  checkpoint: { outDir: './.agentos/checkpoints', topK: 10, pretty: false },
  searchBiasSessionFirst: 0.05,
};

import { vi } from 'vitest';

describe('MemoryOrchestrator', () => {
  test('hybrid search dedupes by canonicalKey across session and agent', () => {
    // Fix time for deterministic ranking
    let tick = 1_700_000_000_000;
    const nowSpy = vi.spyOn(Date, 'now').mockImplementation(() => (tick += 1000));
    const o = new MemoryOrchestrator('agent-1', baseCfg);
    const sid = 's-1';
    o.upsertQuery(sid, 'AgentOS MVP 설계');
    o.getAgentStore().upsertQuery('agentos mvp 설계');
    const res = o.search(sid, 'mvp 설계', 8);
    expect(res.length).toBeGreaterThan(0);
    // same canonicalKey should collapse to a single entry
    const keys = new Set(res.map((r) => r.canonicalKey ?? r.id));
    expect(keys.size).toBe(res.length);

    // Snapshot of sanitized search results (deterministic ordering by text)
    const sanitized = res
      .map((r) => ({
        from: r.from,
        text: r.text,
        canonicalKey: r.canonicalKey,
        score: Number(r.score.toFixed(2)),
      }))
      .sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    expect(sanitized).toMatchSnapshot();
    nowSpy.mockRestore();
  });

  test('finalizeSession promotes hotspots to agent store', async () => {
    const o = new MemoryOrchestrator('agent-2', baseCfg);
    const sid = 's-2';
    const q = o.upsertQuery(sid, '개인화 메모리 그래프 설계');
    o.recordFeedback(sid, q, 'up');
    const sessionStore = o.getSessionStore(sid);
    const sessionNodeRef = sessionStore.getNode(q);
    expect(sessionNodeRef?.generation).toBe('young');
    o.upsertQuery(sid, '개인화 메모리 그래프 설계');
    const before = o.getAgentStore().stats().nodes;
    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const after = o.getAgentStore().stats().nodes;
    expect(after).toBeGreaterThanOrEqual(before);
    const agentNode = o.getAgentStore().getNode(q);
    expect(agentNode?.generation).toBe('old');
    expect(o.getAgentStore().stats().generations.old).toBeGreaterThan(0);
    expect(agentNode).toBe(sessionNodeRef);
    expect(sessionStore.getNode(q)).toBeUndefined();
  });

  test('tag batching links queries and promotes tags with hotspots', async () => {
    const stubExtractor: TagExtractor = {
      async extract() {
        return ['project', 'timeline'];
      },
    };
    const cfg = {
      ...baseCfg,
      tagging: { window: 3, maxTagsPerBatch: 2, extractor: stubExtractor },
    };
    const o = new MemoryOrchestrator('agent-3', cfg);
    const sid = 's-3';
    const q1 = o.upsertQuery(sid, 'Project deadline update for Q3 launch');
    o.upsertQuery(sid, 'Review project deadline risks and mitigation strategies');
    o.upsertQuery(sid, 'Share project timeline updates with stakeholders');
    await o.waitForTagging(sid);
    o.recordFeedback(sid, q1, 'up');
    o.recordFeedback(sid, q1, 'up');
    const sessionStore = o.getSessionStore(sid);
    const tagNodes = sessionStore.listNodes().filter((n) => n.type === 'entity');
    expect(tagNodes.length).toBeGreaterThan(0);
    const tagEdges = sessionStore.getEdges({ from: q1, type: 'refers_to_entity' });
    expect(tagEdges.length).toBeGreaterThan(0);

    await o.finalizeSession(sid, { promote: true, checkpoint: false });
    const agentTagNodes = o
      .getAgentStore()
      .listNodes()
      .filter((n) => n.type === 'entity');
    expect(agentTagNodes.length).toBeGreaterThan(0);
    const projectTag = agentTagNodes.find((n) => n.text === 'project');
    expect(projectTag).toBeDefined();
    const promotedEdges = o
      .getAgentStore()
      .getEdges({ to: projectTag!.id, type: 'refers_to_entity' });
    expect(promotedEdges.some((e) => e.from === q1)).toBe(true);
  });
});
