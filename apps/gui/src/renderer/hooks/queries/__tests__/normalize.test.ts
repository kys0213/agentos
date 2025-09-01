import { normalizeToArrayContent } from '../normalize';

import type { Message } from 'llm-bridge-spec';

describe('normalizeToArrayContent', () => {
  it('keeps array as-is (arrays-only spec)', () => {
    const m: Message = {
      role: 'assistant',
      content: [
        { contentType: 'text', value: 'A' },
        { contentType: 'text', value: 'B' },
      ],
    };
    const out = normalizeToArrayContent(m);
    expect(Array.isArray(out)).toBe(true);
    expect(out.length).toBe(2);
  });
});
