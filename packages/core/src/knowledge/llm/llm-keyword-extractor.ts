import { LlmBridge, Message } from 'llm-bridge-spec';
import { KeywordExtractor } from '../tokenizer';

export interface LlmKeywordExtractorOptions {
  systemPrompt?: string;
  maxKeywords?: number; // default 16
  timeoutMs?: number; // hint only; depends on LlmBridge implementation
}

export class LlmBridgeKeywordExtractor implements KeywordExtractor {
  private readonly systemPrompt: string;
  private readonly defaultMax: number;

  constructor(
    private readonly llm: LlmBridge,
    options?: LlmKeywordExtractorOptions
  ) {
    this.systemPrompt =
      options?.systemPrompt ??
      '당신은 한국어 텍스트에서 핵심 키워드/구를 추출하는 도우미입니다. 출력은 반드시 JSON 배열 문자열만 반환하세요. 설명 금지.';
    this.defaultMax = options?.maxKeywords ?? 16;
  }

  async extractKeywords(text: string, maxKeywords?: number): Promise<string[]> {
    if (!text) return [];
    const limit = Math.max(1, Math.min(maxKeywords ?? this.defaultMax, 64));

    const messages: Message[] = [
      { role: 'system', content: [{ type: 'text', text: this.systemPrompt }] },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text:
              `아래 한국어 텍스트에서 의미 있는 핵심 키워드 또는 짧은 구를 최대 ${limit}개까지 추출하세요. ` +
              '언어는 한국어 중심이나, 고유명사/약어 등은 원문 표기를 유지하세요. 출력은 JSON 배열 문자열만 반환하세요.\n\n' +
              `TEXT:\n${text}`,
          },
        ],
      },
    ];

    const resp: any = await this.llm.invoke({ messages });
    const textOut = extractText(resp);
    const keywords = parseJsonArray(textOut);
    // sanitize: trim/lower and unique preserve original case for now to respect proper nouns
    const seen = new Set<string>();
    const result: string[] = [];
    for (const kw of keywords) {
      const k = String(kw).trim();
      if (!k) continue;
      const dedupKey = k.toLowerCase();
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);
      result.push(k);
    }
    return result;
  }
}

function extractText(resp: any): string {
  if (!resp) return '';
  // common shapes
  if (typeof resp.text === 'string') return resp.text;
  if (typeof resp.outputText === 'string') return resp.outputText;
  const msg = (resp.message ?? resp)?.message;
  const pick = (obj: any) =>
    obj?.content?.find?.((c: any) => typeof c?.text === 'string')?.text ?? '';
  const t1 = pick(resp);
  if (t1) return t1;
  const t2 = pick(msg);
  if (t2) return t2;
  const contents = resp.contents ?? resp?.message?.contents ?? [];
  if (Array.isArray(contents)) {
    const c = contents.find((c: any) => typeof c?.text === 'string');
    if (c?.text) return c.text;
  }
  return '';
}

function parseJsonArray(s: string): any[] {
  if (!s) return [];
  const trimmed = s.trim();
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // try to find first [...] block
    const m = trimmed.match(/\[[\s\S]*\]/);
    if (m) {
      try {
        const parsed = JSON.parse(m[0]);
        return Array.isArray(parsed) ? parsed : [];
      } catch {}
    }
    return [];
  }
}


