import type { EmbeddingProvider } from '../../memory/types';

export type SparseVec = Map<number, number>;

const NF = (s: string) => s.normalize('NFC');
export function normalize(text: string) {
  return NF(text.toLowerCase())
    .replace(/[^\p{L}\p{N}\s.@/_-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ngrams(s: string, minN = 3, maxN = 5): string[] {
  const out: string[] = [];
  const str = s.replace(/\s+/g, ' ');
  for (let n=minN; n<=maxN; n++) {
    for (let i=0; i<=str.length-n; i++) out.push(str.slice(i, i+n));
  }
  return out;
}

function hash64(s: string, seed = 0xC0FFEE): number {
  let h = BigInt(seed) ^ 0xcbf29ce484222325n;
  for (let i=0; i<s.length; i++) {
    h ^= BigInt(s.charCodeAt(i));
    h = (h * 0x00000100000001B3n) & 0xFFFFFFFFFFFFFFFFn;
  }
  return Number(h & 0xFFFFFFFFn);
}

export class SimpleEmbedding implements EmbeddingProvider {
  constructor(private dim = 16384, private minN = 3, private maxN = 5, private seed = 0xC0FFEE) {}

  exportState() {
    return { kind: 'ngram-hash', dim: this.dim, minN: this.minN, maxN: this.maxN, seed: this.seed, normVersion: 'nfc_v1', hashAlgo: 'fnv1a64_demo' };
  }
  importState(s: any) {
    if (!s) return;
    this.dim = s.dim ?? this.dim; this.minN = s.minN ?? this.minN; this.maxN = s.maxN ?? this.maxN; this.seed = s.seed ?? this.seed;
  }

  embed(text: string): SparseVec {
    const t = normalize(text);
    const vec = new Map<number, number>();
    const grams = ngrams(t, this.minN, this.maxN);
    for (const g of grams) {
      const idx = Math.abs(hash64(g, this.seed)) % this.dim;
      vec.set(idx, (vec.get(idx) ?? 0) + 1);
    }
    let norm = 0; for (const v of vec.values()) norm += v*v; norm = Math.sqrt(norm) || 1;
    for (const [i,v] of vec) vec.set(i, v/norm);
    return vec;
  }
}

