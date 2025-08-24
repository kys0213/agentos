export interface Tokenizer {
  tokenize(text: string): Promise<string[]>;
}

export class EnglishSimpleTokenizer implements Tokenizer {
  async tokenize(text: string): Promise<string[]> {
    if (!text) {
      return [];
    }
    const normalized = text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]+/gu, ' ') // remove punctuation except letters/numbers
      .replace(/[\s\u00A0]+/g, ' ') // collapse whitespace
      .trim();
    if (!normalized) {
      return [];
    }
    return normalized.split(' ');
  }
}

// Adapter interface for LLM-based keyword extraction
export interface KeywordExtractor {
  extractKeywords(text: string, maxKeywords?: number, timeoutMs?: number): Promise<string[]>;
}

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
