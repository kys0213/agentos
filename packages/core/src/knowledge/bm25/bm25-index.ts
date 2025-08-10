import { Tokenizer } from '../tokenizer';

export interface BM25IndexOptions {
  k1?: number; // 1.2~2.0
  b?: number; // 0.75
  tokenizer: Tokenizer;
}

export interface BM25SearchResult<TChunkId extends string = string> {
  chunkId: TChunkId;
  score: number;
}

interface Posting<TChunkId extends string> {
  id: TChunkId;
  tf: number;
}

export class InMemoryBM25Index<TChunkId extends string = string> {
  private readonly k1: number;
  private readonly b: number;
  private readonly tokenizer: Tokenizer;

  private readonly index = new Map<string, Posting<TChunkId>[]>(); // term -> postings
  private readonly docLength = new Map<TChunkId, number>(); // chunk length (token count)
  private readonly docCount = new Set<TChunkId>();
  private avgDocLength = 0;

  constructor(options: BM25IndexOptions) {
    this.k1 = options.k1 ?? 1.5;
    this.b = options.b ?? 0.75;
    this.tokenizer = options.tokenizer;
  }

  async add(docId: TChunkId, text: string): Promise<void> {
    const tokens = await this.tokenizer.tokenize(text);

    const tfMap = new Map<string, number>();

    for (const t of tokens) tfMap.set(t, (tfMap.get(t) ?? 0) + 1);

    for (const [term, tf] of tfMap) {
      const postings = this.index.get(term) ?? [];
      postings.push({ id: docId, tf });
      this.index.set(term, postings);
    }

    this.docLength.set(docId, tokens.length);
    this.docCount.add(docId);
    this.recomputeAvgLen();
  }

  async remove(docId: TChunkId): Promise<void> {
    for (const [term, postings] of this.index) {
      const next = postings.filter((p) => p.id !== docId);
      if (next.length === 0) this.index.delete(term);
      else this.index.set(term, next);
    }
    this.docLength.delete(docId);
    this.docCount.delete(docId);
    this.recomputeAvgLen();
  }

  private recomputeAvgLen() {
    let sum = 0;
    for (const len of this.docLength.values()) sum += len;
    this.avgDocLength = this.docLength.size ? sum / this.docLength.size : 0;
  }

  private idf(df: number): number {
    const N = this.docCount.size || 1;
    // BM25 idf with +0.5 smoothing
    return Math.log(1 + (N - df + 0.5) / (df + 0.5));
  }

  async search(query: string, topK: number = 5): Promise<BM25SearchResult<TChunkId>[]> {
    const qTokens = await this.tokenizer.tokenize(query);
    const scores = new Map<TChunkId, number>();

    for (const q of qTokens) {
      const postings = this.index.get(q);
      if (!postings) continue;
      const df = postings.length;
      const idf = this.idf(df);
      for (const { id, tf } of postings) {
        const len = this.docLength.get(id) ?? 0;
        const denom = tf + this.k1 * (1 - this.b + (this.b * len) / (this.avgDocLength || 1));
        const score = idf * ((tf * (this.k1 + 1)) / Math.max(denom, 1e-9));
        scores.set(id, (scores.get(id) ?? 0) + score);
      }
    }

    const results = Array.from(scores.entries())
      .map(([chunkId, score]) => ({ chunkId, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
    return results;
  }
}
