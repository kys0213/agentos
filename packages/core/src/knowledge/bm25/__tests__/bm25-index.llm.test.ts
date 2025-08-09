import { InMemoryBM25Index } from '../../bm25/bm25-index';
import { LlmBridgeKeywordExtractor } from '../../llm/llm-keyword-extractor';
import { LlmKeywordTokenizer, Tokenizer, KeywordExtractor } from '../../tokenizer';

// Mock LlmBridge and extractor for deterministic test
class MockExtractor implements KeywordExtractor {
  constructor(private readonly map: Record<string, string[]>) {}
  async extractKeywords(text: string): Promise<string[]> {
    return this.map[text] ?? [];
  }
}

describe('BM25 with LLM keyword tokenizer (mocked)', () => {
  it('indexes/searches with mocked LLM keywords', async () => {
    const extractor = new MockExtractor({ '한글 텍스트 예시': ['한글', '텍스트', '예시'] });
    const tokenizer = new LlmKeywordTokenizer(extractor, 8);
    const index = new InMemoryBM25Index({ tokenizer });

    await index.add('d1', '한글 텍스트 예시');
    const res = await index.search('텍스트');
    expect(res[0].chunkId).toBe('d1');
  });
});


