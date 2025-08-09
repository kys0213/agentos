import { InMemoryBM25Index } from '../../bm25/bm25-index';
import { EnglishSimpleTokenizer, Tokenizer } from '../../tokenizer';

class StubTokenizer implements Tokenizer {
  constructor(private map: Record<string, string[]>) {}
  async tokenize(text: string): Promise<string[]> {
    return this.map[text] ?? text.split(' ');
  }
}

describe('InMemoryBM25Index', () => {
  it('indexes and searches with simple tokenizer', async () => {
    const index = new InMemoryBM25Index({ tokenizer: new EnglishSimpleTokenizer() });
    await index.add('a', 'hello world');
    await index.add('b', 'hello agentos');
    const r = await index.search('hello');
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].chunkId === 'a' || r[0].chunkId === 'b').toBe(true);
  });

  it('supports removal', async () => {
    const index = new InMemoryBM25Index({ tokenizer: new EnglishSimpleTokenizer() });
    await index.add('x', 'alpha beta gamma');
    await index.remove('x');
    const r = await index.search('alpha');
    expect(r.length).toBe(0);
  });

  it('works with LLM-backed tokenizer (stub)', async () => {
    const index = new InMemoryBM25Index({
      tokenizer: new StubTokenizer({ '한국어 문장': ['한국어', '문장'] }),
    });
    await index.add('k', '한국어 문장');
    const r = await index.search('문장');
    expect(r[0].chunkId).toBe('k');
  });
});
