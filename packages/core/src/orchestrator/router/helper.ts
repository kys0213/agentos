import type { Tokenizer } from '../../knowledge/tokenizer';
import type { BuildDocFn, RouterQuery } from './types';
import type { ReadonlyAgentMetadata } from '../../agent/agent-metadata';
import { getQueryText } from './utils';

export class RouterHelper {
  private readonly tokenCache = new Map<string, string[]>();
  private readonly docCache = new Map<string, string>();

  constructor(
    private readonly tokenizer: Tokenizer,
    private readonly buildDocFn?: BuildDocFn
  ) {}

  async tokenize(text: string): Promise<string[]> {
    const key = text ?? '';
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
}
