const DEFAULT_STRIP_REGEX = /[^\p{L}\p{N}\s.@/_-]/gu;

export interface NormalizeTextOptions {
  /** 소문자 변환 여부 (기본값: true) */
  toLowercase?: boolean;
  /** 허용되지 않은 문자를 대체할 정규식 (기본값: 문자·숫자·공백·.@/_- 만 허용) */
  stripRegex?: RegExp | null;
  /** 연속 공백을 단일 공백으로 축약할지 여부 (기본값: true) */
  collapseWhitespace?: boolean;
}

export function normalizeText(text: string, options: NormalizeTextOptions = {}): string {
  const {
    toLowercase = true,
    stripRegex = DEFAULT_STRIP_REGEX,
    collapseWhitespace = true,
  } = options;
  let normalized = text.normalize('NFC');
  if (toLowercase) {
    normalized = normalized.toLowerCase();
  }
  if (stripRegex) {
    normalized = normalized.replace(stripRegex, ' ');
  }
  if (collapseWhitespace) {
    normalized = normalized.replace(/\s+/g, ' ');
  }
  return normalized.trim();
}

export function tokenizeNormalized(
  text: string,
  options: NormalizeTextOptions = {}
): string[] {
  const normalized = normalizeText(text, options);
  if (!normalized) {
    return [];
  }
  return normalized.split(' ').filter(Boolean);
}
