import type { Message, MultiModalContent } from 'llm-bridge-spec';

export function normalizeToArrayContent(m: Message): MultiModalContent[] {
  const c = (m as any).content;
  if (Array.isArray(c)) {
    return c as MultiModalContent[];
  }
  if (typeof c === 'string') {
    return [{ contentType: 'text', value: c }];
  }
  if (c && typeof c === 'object' && 'contentType' in c) {
    return [c as MultiModalContent];
  }
  return [{ contentType: 'text', value: String(c ?? '') }];
}
