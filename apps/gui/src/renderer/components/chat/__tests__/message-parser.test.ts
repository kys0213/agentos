import { parseMessageContent, parseMessagePreview, hasTextContent } from '../../../utils/message-parser';
import type { MessageHistory } from '@agentos/core';

const msg = (content: any): MessageHistory => ({
  messageId: 'm1',
  role: 'user',
  content,
  createdAt: new Date(),
});

describe('message-parser', () => {
  it('parses array content (core standard)', () => {
    const m = msg([
      { contentType: 'text', value: 'A' },
      { contentType: 'text', value: 'B' },
    ]);
    expect(parseMessageContent(m)).toBe('A\nB');
    expect(hasTextContent(m)).toBe(true);
  });

  it('parses legacy single object', () => {
    const m = msg({ contentType: 'text', value: 'X' });
    expect(parseMessageContent(m)).toBe('X');
    expect(hasTextContent(m)).toBe(true);
  });

  it('parses string fallback', () => {
    const m = msg('raw');
    expect(parseMessageContent(m)).toBe('raw');
    expect(hasTextContent(m)).toBe(true);
  });

  it('preview truncates long line', () => {
    const long = 'x'.repeat(120);
    const m = msg([{ contentType: 'text', value: long }]);
    const p = parseMessagePreview(m, 20);
    expect(p.endsWith('...')).toBe(true);
    expect(p.length).toBe(20);
  });
});


