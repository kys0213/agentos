import { GraphStore } from '../../memory/graph-store';
import { SimpleEmbedding } from '../../memory/embedding/simple-embedding';

describe('Eviction respects maxNodes/maxEdges', () => {
  test('nodes do not exceed maxNodes after many inserts', () => {
    const cfg: GraphConfig = {
      maxNodes: 30,
      maxEdges: 200,
      halfLifeMin: 240,
      tauDup: 0.5,
      tauSim: 0.4,
      protectMinDegree: 1,
      enableInvertedIndex: false,
    };
    const g = new GraphStore(cfg, new SimpleEmbedding());
    for (let i = 0; i < 120; i++) {
      g.upsertQuery(`테스트 케이스 작성 ${i}`);
    }
    const stats = g.stats();
    expect(stats.nodes).toBeLessThanOrEqual(30);
    expect(stats.edges).toBeLessThanOrEqual(200);
  });

  test('old generation nodes are evicted last', () => {
    const cfg: GraphConfig = {
      maxNodes: 3,
      maxEdges: 20,
      halfLifeMin: 10,
      tauDup: 0.2,
      tauSim: 0.1,
      protectMinDegree: 1,
      enableInvertedIndex: false,
    };
    const g = new GraphStore(cfg, new SimpleEmbedding());
    const anchors = ['alpha', 'beta', 'gamma'].map((t) => g.upsertQuery(t));
    g.promoteGeneration(anchors[0], 'old');
    g.upsertQuery('delta');
    expect(g.stats().nodes).toBeLessThanOrEqual(3);
    expect(g.getNode(anchors[0])).toBeDefined();
    expect(g.stats().generations.old).toBe(1);
  });
});
import type { GraphConfig } from '../types';
