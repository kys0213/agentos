import { date } from '../../..';

const { ZonedDateTime, Format, asTimeZone } = date;

describe('ZonedDateTime', () => {
  const SEOUL = asTimeZone('Asia/Seoul');
  const UTC = asTimeZone('UTC');

  it('now() creates instance with given timezone', () => {
    const now = ZonedDateTime.now(SEOUL);
    expect(now.timeZone).toBe('Asia/Seoul');
  });

  it('valueOf parses ISO with offset as instant', () => {
    const dt = ZonedDateTime.valueOf('2025-08-09T00:00:00Z', SEOUL);
    expect(dt.toISO({ includeOffset: false })).toBe('2025-08-09T00:00:00Z');
  });

  it('valueOf interprets naive string in provided timezone', () => {
    const naive = '2025-01-01T12:00:00';
    const seoulLocal = ZonedDateTime.valueOf(naive, SEOUL);
    const utcLocal = ZonedDateTime.valueOf(naive, UTC);
    expect(seoulLocal.isAfter(utcLocal) || seoulLocal.isBefore(utcLocal)).toBe(true);
  });

  it('comparisons are UTC-based', () => {
    const a = ZonedDateTime.valueOf('2025-01-01T00:00:00Z', SEOUL);
    const b = ZonedDateTime.valueOf('2025-01-01T00:00:01Z', UTC);
    expect(a.isBefore(b)).toBe(true);
    expect(b.isAfter(a)).toBe(true);
  });

  it('isBetween with inclusive options', () => {
    const a = ZonedDateTime.valueOf('2025-01-01T00:00:00Z', SEOUL);
    const m = ZonedDateTime.valueOf('2025-01-01T00:00:01Z', SEOUL);
    const b = ZonedDateTime.valueOf('2025-01-01T00:00:02Z', SEOUL);
    expect(m.isBetween(a, b)).toBe(true);
    expect(a.isBetween(a, b, '()')).toBe(false);
    expect(b.isBetween(a, b, '[)')).toBe(false);
  });

  it('add/minus builder works for absolute and calendar units', () => {
    const base = ZonedDateTime.valueOf('2025-03-30T01:30:00Z', asTimeZone('Europe/Berlin'));
    const plus90m = base.add().minutes(90);
    expect(plus90m.isAfter(base)).toBe(true);
    const plus1d = base.add().days(1);
    expect(plus1d.isAfter(base)).toBe(true);
    const minus2h = base.minus().hours(2);
    expect(minus2h.isBefore(base)).toBe(true);
  });

  it('format and toISO respect timezone / options', () => {
    const d = ZonedDateTime.valueOf('2025-08-09T06:45:00Z', SEOUL);
    const s1 = d.format({ preset: Format.YMDHH24MISS });
    expect(typeof s1).toBe('string');
    const s2 = d.toISO();
    const s3 = d.toISO({ includeOffset: false });
    expect(s2).toMatch(/\+09:00|Z/);
    expect(s3.endsWith('Z')).toBe(true);
  });
});
