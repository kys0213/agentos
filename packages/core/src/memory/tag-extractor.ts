import { LlmBridge, UserMessage } from 'llm-bridge-spec';
import { parseJsonArray } from '@agentos/lang/json';

import { canonicalTagKey } from './utils/tag-key';

export interface TagExtractorInput {
  texts: string[];
  existing: string[];
  maxTags: number;
}

export interface TagExtractor {
  extract(input: TagExtractorInput): Promise<string[]>;
}

export interface LlmTagExtractorOptions {
  /**
   * 시스템 프롬프트는 호출 시마다 재사용되며, 한국어 대화 맥락에서 태그를 도출하도록 안내합니다.
   */
  systemPrompt?: string;
  /**
   * 대화 묶음과 기존 태그를 나열할 때 사용할 구분자. 기본값은 줄바꿈입니다.
   */
  joinSeparator?: string;
  /**
   * 결과 최대 태그 수의 기본값. 호출 입력의 maxTags가 우선합니다.
   */
  maxTags?: number;
}

const DEFAULT_SYSTEM_PROMPT =
  '당신은 대화 히스토리에서 의미 있는 주제 태그를 도출하는 한국어 어시스턴트입니다. ' +
  '사용자가 제공한 기존 태그 목록과 중복되지 않도록 주의하며, 출력은 반드시 JSON 배열 문자열 형식으로만 반환하세요.';

export class LlmTagExtractor implements TagExtractor {
  private readonly systemPrompt: string;
  private readonly separator: string;
  private readonly defaultMax: number;

  constructor(private readonly llm: LlmBridge, options?: LlmTagExtractorOptions) {
    this.systemPrompt = options?.systemPrompt ?? DEFAULT_SYSTEM_PROMPT;
    this.separator = options?.joinSeparator ?? '\n';
    this.defaultMax = options?.maxTags ?? 8;
  }

  async extract({ texts, existing, maxTags }: TagExtractorInput): Promise<string[]> {
    if (!texts.length) {
      return [];
    }

    const limit = Math.max(1, Math.min(maxTags || this.defaultMax, 64));

    const existingSet = new Set(existing.map((tag) => canonicalTagKey(tag)));

    const conversationBlock = texts
      .map((text, index) => `${index + 1}. ${text}`)
      .join(this.separator);
    const existingBlock = existing.length
      ? existing.map((tag) => `- ${tag}`).join(this.separator)
      : '- (없음)';

    const payload =
      '### 기존 태그 목록\n' +
      `${existingBlock}\n\n` +
      '### 최근 대화 묶음\n' +
      `${conversationBlock}\n\n` +
      `위 맥락을 대표하는 새로운 태그를 최대 ${limit}개까지 추출하세요. ` +
      '기존 태그와 의미가 매우 유사하면 중복 생성하지 마세요.';

    const messages: UserMessage[] = [
      {
        role: 'system',
        content: [{ contentType: 'text', value: this.systemPrompt }],
      },
      {
        role: 'user',
        content: [{ contentType: 'text', value: payload }],
      },
    ];

    const response = await this.llm.invoke({ messages });
    const raw = extractText(response);
    const parsed = parseJsonArray(raw);

    const seen = new Set(existingSet);
    const results: string[] = [];

    for (const kw of parsed) {
      if (results.length >= limit) {
        break;
      }
      const normalized = String(kw).trim();
      if (!normalized) {
        continue;
      }
      const key = canonicalTagKey(normalized);
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      results.push(normalized);
    }

    return results;
  }
}

function extractText(resp: { content: { contentType: string; value: unknown } }): string {
  if (resp.content.contentType !== 'text') {
    throw new Error(`Unsupported content type: ${resp.content.contentType}`);
  }
  return String(resp.content.value ?? '');
}

