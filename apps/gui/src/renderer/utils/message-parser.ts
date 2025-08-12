import { MessageHistory } from '@agentos/core';

/**
 * Message content를 텍스트 문자열로 파싱
 * @param message MessageHistory 또는 MessageRecord
 * @returns 파싱된 텍스트 문자열
 */
export function parseMessageContent(message: MessageHistory): string {
  if (!message.content) {
    return '';
  }

  // MessageRecord 타입 (IPC 통신용)
  if (typeof message.content === 'string') {
    return message.content;
  }

  // MessageHistory 타입 (Core 표준: 배열)
  if (Array.isArray(message.content)) {
    return message.content
      .filter((c) => c.contentType === 'text')
      .map((c) => c.value)
      .join('\n');
  }

  // 단일 콘텐츠(레거시) 호환 처리
  if (typeof message.content === 'object' && 'contentType' in message.content) {
    const legacy = message.content as any;
    return legacy.contentType === 'text' ? legacy.value : '';
  }

  return '';
}

/**
 * Message content가 비어있는지 확인
 * @param message MessageHistory 또는 MessageRecord
 * @returns content가 비어있으면 true
 */
export function isMessageContentEmpty(message: MessageHistory): boolean {
  const content = parseMessageContent(message);
  return !content || content.trim().length === 0;
}

/**
 * Message content에서 첫 번째 줄만 추출 (preview용)
 * @param message MessageHistory 또는 MessageRecord
 * @param maxLength 최대 길이 (기본값: 100)
 * @returns 첫 번째 줄 또는 요약된 텍스트
 */
export function parseMessagePreview(message: MessageHistory, maxLength: number = 100): string {
  const fullContent = parseMessageContent(message);
  const firstLine = fullContent.split('\n')[0] || '';

  if (firstLine.length <= maxLength) {
    return firstLine;
  }

  return firstLine.substring(0, maxLength - 3) + '...';
}

/**
 * Message content type 확인
 * @param message MessageHistory 또는 MessageRecord
 * @returns content에 텍스트가 포함되어 있으면 true
 */
export function hasTextContent(message: MessageHistory): boolean {
  if (!message.content) return false;

  if (typeof message.content === 'string') return true;

  if (Array.isArray(message.content)) {
    return message.content.some((c) => c.contentType === 'text');
  }

  if (typeof message.content === 'object' && 'contentType' in message.content) {
    return message.content.contentType === 'text';
  }

  return false;
}
