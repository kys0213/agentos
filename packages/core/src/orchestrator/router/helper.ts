import type { KeywordExtractor, Tokenizer } from '../../knowledge/tokenizer';
import { LlmKeywordTokenizer } from '../../knowledge/tokenizer';
import type { BuildDocFn, RouterQuery } from './types';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import { getQueryText } from './utils';

export class RouterHelper {
  private readonly tokenCache = new Map<string, string[]>();
  private readonly docCache = new Map<string, string>();
  private queryLocale?: string;
  private llmTokenizer?: Tokenizer;
  private llmWhen: 'always' | 'locale_cjk' | 'never' = 'never';

  constructor(
    private readonly tokenizer: Tokenizer,
    private readonly buildDocFn?: BuildDocFn
  ) {}

  async tokenizeQuery(text: string): Promise<string[]> {
    const key = this.tokenCacheKey(text, true);
    const hit = this.tokenCache.get(key);
    if (hit) {
      return hit;
    }
    let tokens: string[];
    if (this.shouldUseLlm() && this.llmTokenizer) {
      tokens = await this.llmTokenizer.tokenize(text);
    } else {
      tokens = await this.tokenizer.tokenize(text);
    }
    this.tokenCache.set(key, tokens);
    return tokens;
  }

  async tokenizeDoc(text: string): Promise<string[]> {
    const key = this.tokenCacheKey(text, false);
    const hit = this.tokenCache.get(key);
    if (hit) {
      return hit;
    }
    const tokens = await this.tokenizer.tokenize(text);
    this.tokenCache.set(key, tokens);
    return tokens;
  }

  buildDoc(meta: ReadonlyAgentMetadata): string {
    if (!this.buildDocFn) {
      return `${meta.name} ${meta.description}`;
    }
    const key = `${meta.id}:${meta.version ?? 'v0'}`;
    const hit = this.docCache.get(key);
    if (hit) {
      return hit;
    }
    const d = this.buildDocFn(meta);
    this.docCache.set(key, d);
    return d;
  }

  getQueryText(query: RouterQuery): string {
    return getQueryText(query);
  }

  setQueryContext(query: RouterQuery) {
    this.queryLocale = query.locale;
  }

  configureLlm(
    extractor: KeywordExtractor,
    opts?: { maxKeywords?: number; when?: 'always' | 'locale_cjk' | 'never' }
  ) {
    this.llmTokenizer = new LlmKeywordTokenizer(extractor, opts?.maxKeywords);
    this.llmWhen = opts?.when ?? 'never';
  }

  private tokenCacheKey(text: string, forQuery: boolean) {
    const mode = forQuery && this.shouldUseLlm() ? 'llm' : 'base';
    return `${mode}:${text ?? ''}`;
  }

  private shouldUseLlm(): boolean {
    if (!this.llmTokenizer) {
      return false;
    }
    if (this.llmWhen === 'always') {
      return true;
    }
    if (this.llmWhen === 'never') {
      return false;
    }
    const loc = (this.queryLocale ?? '').toLowerCase();
    return loc.startsWith('ko') || loc.startsWith('ja') || loc.startsWith('zh');
  }
}
