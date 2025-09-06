export interface Tokenizer {
  tokenize(text: string): Promise<string[]>;
}

// Adapter interface for LLM-based keyword extraction
export interface KeywordExtractor {
  extractKeywords(text: string, maxKeywords?: number, timeoutMs?: number): Promise<string[]>;
}
