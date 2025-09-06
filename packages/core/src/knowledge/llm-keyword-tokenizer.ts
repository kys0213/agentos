import { Tokenizer, KeywordExtractor } from './tokenizer';

export class LlmKeywordTokenizer implements Tokenizer {
  constructor(
    private readonly extractor: KeywordExtractor,
    private readonly maxKeywords: number = 16
  ) {}

  async tokenize(text: string): Promise<string[]> {
    if (!text) {
      return [];
    }
    const keywords = await this.extractor.extractKeywords(text, this.maxKeywords);
    // Normalize keywords to tokens (lowercase, trim, deduplicate)
    const unique = new Set<string>();
    for (const kw of keywords) {
      const k = kw.toLowerCase().trim();
      if (k) {
        unique.add(k);
      }
    }
    const tokens = Array.from(unique.values());
    if (tokens.length > 0) {
      return tokens;
    }
    // Fallback: basic whitespace/punct split to avoid empty keyword results
    const normalized = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
      .replace(/[\s\u00A0]+/g, ' ')
      .trim();
    return normalized ? normalized.split(' ') : [];
  }
}
