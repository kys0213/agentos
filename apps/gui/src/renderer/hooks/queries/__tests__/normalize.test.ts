import { normalizeToArrayContent } from '../normalize';

describe('normalizeToArrayContent', () => {
  it('keeps array as-is', () => {
    const m: any = {
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

  it('wraps single object', () => {
    const m: any = {
      role: 'assistant',
      content: { contentType: 'text', value: 'X' },
    };
    const out = normalizeToArrayContent(m);
    expect(out).toEqual([{ contentType: 'text', value: 'X' }]);
  });

  it('wraps string into text item', () => {
    const m: any = {
      role: 'assistant',
      content: 'raw',
    };
    const out = normalizeToArrayContent(m);
    expect(out).toEqual([{ contentType: 'text', value: 'raw' }]);
  });
});

