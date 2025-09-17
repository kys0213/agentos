import type { LlmBridge, UserMessage, LlmBridgeResponse } from 'llm-bridge-spec';
import type { LlmReranker, LlmRoutingPolicy, RouterQuery } from '../types';
import type { RouterHelper } from '../helper';
import { parseJsonArray } from '@agentos/lang/json';

const SYSTEM_PROMPT = `ROLE
You are a routing assistant. Read the QUERY and the CANDIDATES below and score each candidate agent by relevance.

INSTRUCTIONS
- Score each candidate in the range 0..1 (higher is better). Minimize ties by reflecting small differences.
- Consider signals: intent/keywords/locale, categories, available tool names, file types & multimodal fit, hints/tags.
- Use ONLY the provided candidate docs. Do NOT invent information. Do NOT leak query text.
- Return ONLY a JSON array string of objects: [{ "agentId": string, "score": number }]
- Do NOT include explanations, code blocks, comments, or any extra text.

OUTPUT FORMAT
[
  { "agentId": "alpha", "score": 0.82 },
  { "agentId": "beta",  "score": 0.31 }
]`;

export class DefaultLlmReranker implements LlmReranker {
  constructor(private readonly llm: LlmBridge) {}

  async rerank(args: {
    query: RouterQuery;
    candidates: Array<{ agentId: string; doc: string }>;
    helper: RouterHelper;
    policy: LlmRoutingPolicy;
  }): Promise<Array<{ agentId: string; score: number }>> {
    const q = args.helper.getQueryText(args.query);
    const topN = Math.max(
      1,
      Math.min(args.policy.topN ?? Math.min(8, args.candidates.length), args.candidates.length)
    );
    const docs = args.candidates.slice(0, topN);

    const payload = this.buildPrompt(q, args.query, docs);
    const messages: UserMessage[] = [
      { role: 'user', content: [{ contentType: 'text', value: payload }] },
    ];
    const resp: LlmBridgeResponse = await this.llm.invoke({ messages });
    const text = this.extractText(resp);
    const arr = parseJsonArray(text);
    const out: Array<{ agentId: string; score: number }> = [];
    for (const it of arr as unknown[]) {
      const obj = it as { agentId?: string; score?: unknown };
      if (typeof obj?.agentId === 'string') {
        const score = typeof obj.score === 'number' ? obj.score : 1;
        out.push({ agentId: obj.agentId, score });
      } else if (typeof it === 'string') {
        out.push({ agentId: it as string, score: 1 });
      }
    }
    return out;
  }

  private buildPrompt(
    queryText: string,
    query: RouterQuery,
    docs: Array<{ agentId: string; doc: string }>
  ): string {
    const header = SYSTEM_PROMPT;
    const locale = (query.locale ?? 'unknown').toString();
    const hints: string[] = [...(query.tags ?? []), ...(query.routingHints ?? [])]
      .map((s) => String(s))
      .filter(Boolean);
    const hintsLine = hints.length ? `\nHINTS\n${hints.join(', ')}` : '';
    const candidates = docs.map((d, i) => `#${i + 1} id=${d.agentId}\n${d.doc}`).join('\n\n');
    return `${header}\n\nLOCALE\n${locale}\n\nQUERY\n${queryText}${hintsLine}\n\nCANDIDATES\n${candidates}\n\nJSON:`;
  }

  private extractText(resp: LlmBridgeResponse): string {
    if (resp.content.contentType !== 'text') {
      throw new Error(`Unsupported content type: ${resp.content.contentType}`);
    }
    return String(resp.content.value);
  }
}
