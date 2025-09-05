import type { Tokenizer, KeywordExtractor } from '../../knowledge/tokenizer';
import type { BuildDocFn } from './types';
import type { RoutingStrategyFn, LlmRoutingPolicy, LlmReranker } from './types';
import type { LlmBridge } from 'llm-bridge-spec';
import { EnglishSimpleTokenizer } from '../../knowledge/tokenizer';
import { CompositeAgentRouter } from './composite-router';
import { DefaultLlmReranker } from './llm/default-reranker';
import { LlmBridgeKeywordExtractor } from '../../knowledge/llm/llm-keyword-extractor';

export class RouterBuilder {
  private _tokenizer: Tokenizer = new EnglishSimpleTokenizer();
  private _buildDoc?: BuildDocFn;
  private _strategies: RoutingStrategyFn[] = [];
  private _llmKeyword?: {
    extractor: KeywordExtractor;
    maxKeywords?: number;
    when?: 'always' | 'locale_cjk' | 'never';
  };
  private _llmPolicy?: LlmRoutingPolicy;
  private _reranker?: LlmReranker;
  private _compare?: import('./types').RankComparator;

  static create(tokenizer?: Tokenizer, buildDoc?: BuildDocFn): RouterBuilder {
    const b = new RouterBuilder();
    if (tokenizer) {
      b._tokenizer = tokenizer;
    }
    if (buildDoc) {
      b._buildDoc = buildDoc;
    }
    return b;
  }

  tokenizer(t: Tokenizer): this {
    this._tokenizer = t;
    return this;
  }

  docBuilder(fn: BuildDocFn): this {
    this._buildDoc = fn;
    return this;
  }

  strategy(fn: RoutingStrategyFn): this {
    this._strategies.push(fn);
    return this;
  }

  strategies(fns: RoutingStrategyFn[]): this {
    this._strategies.push(...fns);
    return this;
  }

  llmKeyword(
    extractor: KeywordExtractor,
    when: 'always' | 'locale_cjk' | 'never' = 'locale_cjk',
    maxKeywords?: number
  ): this {
    this._llmKeyword = { extractor, when, maxKeywords };
    return this;
  }

  reranker(r: LlmReranker): this {
    this._reranker = r;
    return this;
  }

  policy(p: LlmRoutingPolicy): this {
    this._llmPolicy = p;
    return this;
  }

  compare(cmp: import('./types').RankComparator): this {
    this._compare = cmp;
    return this;
  }

  // Convenience: configure LLM rerank and optional keyword extraction via bridge
  llm(
    bridge: LlmBridge,
    opts?: {
      policy?: LlmRoutingPolicy;
      keyword?: { when?: 'always' | 'locale_cjk' | 'never'; maxKeywords?: number; extractor?: KeywordExtractor };
    }
  ): this {
    this._reranker = new DefaultLlmReranker(bridge);
    this._llmPolicy = opts?.policy ?? {
      enableKeyword: false,
      enableRerank: true,
      topN: 5,
      alphaBlend: 0.6,
    };
    if (opts?.keyword) {
      const extractor =
        opts.keyword.extractor ?? new LlmBridgeKeywordExtractor(bridge, { maxKeywords: opts.keyword.maxKeywords });
      this._llmKeyword = {
        extractor,
        when: opts.keyword.when ?? 'locale_cjk',
        maxKeywords: opts.keyword.maxKeywords,
      };
    }
    return this;
  }

  build(): CompositeAgentRouter {
    if (this._strategies.length === 0) {
      throw new Error('No routing strategies configured. Use strategy()/strategies().');
    }
    const options: ConstructorParameters<typeof CompositeAgentRouter>[1] = {
      tokenizer: this._tokenizer,
      buildDoc: this._buildDoc,
      compare: this._compare,
      llmKeyword: this._llmKeyword,
      llm: this._llmPolicy || this._reranker
        ? { policy: this._llmPolicy ?? { enableRerank: true, enableKeyword: Boolean(this._llmKeyword), topN: 5, alphaBlend: 0.6 }, reranker: this._reranker }
        : undefined,
    };
    return new CompositeAgentRouter(this._strategies, options);
  }
}

