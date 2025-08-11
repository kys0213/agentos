import { safeJsonParseWithReviver, safeJsonParseWithDates } from '../parser';

describe('JSON parser utilities', () => {
  it('applies provided reviver', () => {
    const json = '{"value":"42"}';
    const res = safeJsonParseWithReviver<{ value: number }>(json, (key, value) =>
      key === 'value' ? Number(value) : value,
    );
    expect(res.success).toBe(true);
    expect(res.success && (res.result.value === 42)).toBe(true);
  });

  it('converts ISO strings to Date with safeJsonParseWithDates', () => {
    const iso = '2024-01-01T00:00:00.000Z';
    const json = `{"date":"${iso}"}`;
    const res = safeJsonParseWithDates<{ date: Date }>(json);
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.result.date).toBeInstanceOf(Date);
      expect(res.result.date.toISOString()).toBe(iso);
    }
  });
});
