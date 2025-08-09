import { LlmBridge, UserMessage, LlmBridgeResponse } from 'llm-bridge-spec';
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

    const combinedText =
      `${this.systemPrompt}\n\n` +
      `아래 한국어 텍스트에서 의미 있는 핵심 키워드 또는 짧은 구를 최대 ${limit}개까지 추출하세요. ` +
      '언어는 한국어 중심이나, 고유명사/약어 등은 원문 표기를 유지하세요. 출력은 JSON 배열 문자열만 반환하세요.\n\n' +
      `TEXT:\n${text}`;

    const messages: UserMessage[] = [
      {
        role: 'user',
        content: { contentType: 'text', value: combinedText },
      },
    ];

    const resp: LlmBridgeResponse = await this.llm.invoke({ messages });
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

function extractText(resp: LlmBridgeResponse): string {
  if (resp.content.contentType !== 'text') {
    throw new Error(`Unsupported content type: ${resp.content.contentType}`);
  }

  return resp.content.value as string;
}

function parseJsonArray(s: string): string[] {
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
