import { Tokenizer } from './tokenizer';

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
