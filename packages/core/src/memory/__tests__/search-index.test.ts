import { GraphStore } from '../../memory/graph-store';
import { SimpleEmbedding } from '../../memory/embedding/simple-embedding';

function buildQueries(): string[] {
  const arr = [
    '제품A 테스트 케이스 작성', '제품A 테스트케이스 작성', '제품A 리그레이션 테스트',
    '제품B 테스트 케이스 작성', '제품B 회귀 테스트', '제품B 테스트케이스 조회',
    '제품C 테스트 증적 검증 요청', '제품C 테스트 결과 증빙 확인', '제품C 테스트 케이스 검색',
    '테스트 케이스 초안 만들기', '테스트케이스 템플릿 생성', '회귀 테스트 계획 수립',
  ];
  return arr.concat(arr); // duplicates to grow
}

describe('Inverted index on/off yields consistent results', () => {
  test('top-k results overlap and look consistent (snapshot)', () => {
    const base = { maxNodes: 1000, maxEdges: 4000, halfLifeMin: 240, tauDup: 0.96, tauSim: 0.75, protectMinDegree: 3 };
    const gOff = new GraphStore({ ...base, enableInvertedIndex: false }, new SimpleEmbedding());
    const gOn  = new GraphStore({ ...base, enableInvertedIndex: true }, new SimpleEmbedding());
    const qs = buildQueries();
    for (const q of qs) { gOff.upsertQuery(q); gOn.upsertQuery(q); }
    const q = '제품A 테스트케이스 검색';
    const off = gOff.searchSimilarQueries(q, 8).map(r => r.canonicalKey ?? r.id);
    const on  = gOn.searchSimilarQueries(q, 8).map(r => r.canonicalKey ?? r.id);
    expect(off.length).toBeGreaterThan(0);
    expect(on.length).toBeGreaterThan(0);
    const inter = new Set(off.filter(x => new Set(on).has(x)));
    expect(inter.size).toBeGreaterThanOrEqual(5); // substantial overlap

    // snapshot ordering by text for human inspection
    const sOff = gOff.searchSimilarQueries(q, 8).map(r => ({ text: r.text, score: Number(r.score.toFixed(2)) }))
      .sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    const sOn = gOn.searchSimilarQueries(q, 8).map(r => ({ text: r.text, score: Number(r.score.toFixed(2)) }))
      .sort((a, b) => (a.text || '').localeCompare(b.text || ''));
    expect({ off: sOff, on: sOn }).toMatchSnapshot();
  });
});
