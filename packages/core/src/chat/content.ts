import type { MultiModalContent as BridgeContent } from 'llm-bridge-spec';

/**
 * Core 표준 콘텐츠 타입
 * - llm-bridge-spec의 MultiModalContent 스키마를 그대로 채택합니다
 * - contentType/value 형태로 통일합니다
 */
export type CoreContent = BridgeContent;

/**
 * Core 표준 메시지 타입 (멀티모달 배열 표준)
 */
export interface CoreMessage {
  messageId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: CoreContent[];
  createdAt: Date;
  meta?: Record<string, unknown>;
}

/**
 * 단일/배열 입력을 내부 표준 배열로 정규화합니다
 */
export function toCoreContentArray(
  input: CoreContent | CoreContent[] | null | undefined
): CoreContent[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

/**
 * 런타임 느슨한 입력을 CoreContent[]로 정규화합니다
 * - 문자열: text 콘텐츠로 변환
 * - 배열: 각 요소를 CoreContent로 시도, 실패 시 text로 강제
 * - 객체: contentType/value 형태면 그대로, 아니면 JSON 문자열로 강제
 */
export function normalizeToCoreContentArray(input: unknown): CoreContent[] {
  if (input == null) return [];

  if (typeof input === 'string') {
    return [{ contentType: 'text', value: input } as CoreContent];
  }

  if (Array.isArray(input)) {
    return input.flatMap((item) => normalizeToCoreContentArray(item));
  }

  if (typeof input === 'object') {
    const maybe = input as { contentType?: unknown; value?: unknown };
    if (
      typeof maybe.contentType === 'string' &&
      ['text', 'image', 'audio', 'video', 'file'].includes(maybe.contentType)
    ) {
      return [maybe as CoreContent];
    }
    // 객체이지만 표준 스키마가 아니면 JSON으로 강제
    try {
      return [{ contentType: 'text', value: JSON.stringify(input) } as CoreContent];
    } catch {
      return [{ contentType: 'text', value: String(input) } as CoreContent];
    }
  }

  // 기타(숫자/불리언 등)
  return [{ contentType: 'text', value: String(input) } as CoreContent];
}
