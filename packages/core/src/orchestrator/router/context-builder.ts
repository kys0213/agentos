import type { Tokenizer, KeywordExtractor } from '../../knowledge/tokenizer';
import type { BuildDocFn, RouterQuery } from './types';
import { RouterHelper } from './helper';

export interface RouterBuilderOptions {
  llmKeyword?: {
    extractor: KeywordExtractor;
    maxKeywords?: number;
    when?: 'always' | 'locale_cjk' | 'never';
  };
}

// Builder that produces a per-request routing context (token/doc caches + policy applied)
export class RouterContextBuilder {
  constructor(
    private readonly tokenizer: Tokenizer,
    private readonly buildDoc?: BuildDocFn,
    private readonly options?: RouterBuilderOptions
  ) {}

  build(query: RouterQuery): RouterHelper {
    const ctx = new RouterHelper(this.tokenizer, this.buildDoc);
    if (this.options && this.options.llmKeyword) {
      const { extractor, maxKeywords, when } = this.options.llmKeyword;
      ctx.configureLlm(extractor, { maxKeywords, when });
    }
    ctx.setQueryContext(query);
    return ctx;
  }
}

