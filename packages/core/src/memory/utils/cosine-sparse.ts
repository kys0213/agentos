import type { SparseVec } from '../../memory/embedding/simple-embedding';

export function cosineSparse(a: SparseVec, b: SparseVec) {
  let dot=0, na=0, nb=0;
  for (const [,v] of a) na += v*v;
  for (const [,v] of b) nb += v*v;
  const small = a.size <= b.size ? a : b;
  const big = small === a ? b : a;
  for (const [i, v] of small) {
    const w = big.get(i);
    if (w) dot += v*w;
  }
  const denom = (Math.sqrt(na)||1)*(Math.sqrt(nb)||1);
  return dot / denom;
}

