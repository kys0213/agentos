import { GraphStore } from '../../memory/graph-store';
import { SimpleEmbedding } from '../../memory/embedding/simple-embedding';

describe('Eviction respects maxNodes/maxEdges', () => {
  test('nodes do not exceed maxNodes after many inserts', () => {
    const cfg = { maxNodes: 30, maxEdges: 200, halfLifeMin: 240, tauDup: 0.5, tauSim: 0.4, protectMinDegree: 1, enableInvertedIndex: false };
    const g = new GraphStore(cfg as any, new SimpleEmbedding());
    for (let i=0;i<120;i++) g.upsertQuery(`테스트 케이스 작성 ${i}`);
    const stats = g.stats();
    expect(stats.nodes).toBeLessThanOrEqual(30);
    expect(stats.edges).toBeLessThanOrEqual(200);
  });
});

