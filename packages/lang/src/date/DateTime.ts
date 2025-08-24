import {
  addDays as addCalendarDays,
  addMilliseconds,
  endOfDay as dfEndOfDay,
  isAfter as dfIsAfter,
  isBefore as dfIsBefore,
  startOfDay as dfStartOfDay,
  parseISO,
} from 'date-fns';
import { formatInTimeZone, fromZonedTime, toZonedTime } from 'date-fns-tz';
import { type TimeZone } from './timezone';

export enum Format {
  YMD = 'yyyy-MM-dd',
  YMDHH24 = 'yyyy-MM-dd HH:mm',
  YMDHH24MISS = 'yyyy-MM-dd HH:mm:ss',
  ISO8601_OFFSET = "yyyy-MM-dd'T'HH:mm:ssXXX",
  ISO8601_BASIC_Z = "yyyyMMdd'T'HHmmss'Z'",
}

export type IsoFormat = 'extended' | 'basic';

export interface ToISOOptions {
  format?: IsoFormat; // default: 'extended'
  includeOffset?: boolean; // default: true
}

export interface FormatOptions {
  pattern?: string; // custom pattern if provided
  preset?: Format; // fallback preset
}

export class ZonedDateTime {
  private readonly utcDate: Date;
  readonly timeZone: TimeZone;

  private constructor(utcDate: Date, timeZone: TimeZone) {
    this.utcDate = utcDate;
    this.timeZone = timeZone;
  }

  // Factory
  static now(timeZone: TimeZone = 'UTC'): ZonedDateTime {
    return new ZonedDateTime(new Date(), timeZone);
  }

  static valueOf(input: Date | string | number, timeZone: TimeZone = 'UTC'): ZonedDateTime {
    const utc = ensureDate(input, timeZone);
    return new ZonedDateTime(utc, timeZone);
  }

  static fromISO(iso: string, defaultTimeZone: TimeZone = 'UTC'): ZonedDateTime {
    const utc = ensureDate(iso, defaultTimeZone);
    return new ZonedDateTime(utc, defaultTimeZone);
  }

  // Comparisons (compare instants in UTC)
  isBefore(other: ZonedDateTime): boolean {
    return dfIsBefore(this.utcDate, other.utcDate);
  }

  isAfter(other: ZonedDateTime): boolean {
    return dfIsAfter(this.utcDate, other.utcDate);
  }

  isBetween(
    start: ZonedDateTime,
    end: ZonedDateTime,
    inclusive: '()' | '[]' | '[)' | '(]' = '[]'
  ): boolean {
    const t = this.utcDate.getTime();
    const a = start.utcDate.getTime();
    const b = end.utcDate.getTime();
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    if (inclusive === '[]') {
      return t >= lo && t <= hi;
    }
    if (inclusive === '()') {
      return t > lo && t < hi;
    }
    if (inclusive === '[)') {
      return t >= lo && t < hi;
    }
    return t > lo && t <= hi; // '(]'
  }

  // Time zone transformations
  withTimeZone(timeZone: TimeZone): ZonedDateTime {
    return new ZonedDateTime(new Date(this.utcDate.getTime()), timeZone);
  }

  // Absolute time arithmetic (UTC-based)
  private addMs(ms: number): ZonedDateTime {
    return new ZonedDateTime(addMilliseconds(this.utcDate, ms), this.timeZone);
  }

  // Calendar arithmetic in the configured time zone
  private addDaysCalendar(days: number): ZonedDateTime {
    const local = toZonedTime(this.utcDate, this.timeZone);
    const shiftedLocal = addCalendarDays(local, days);
    const backToUtc = fromZonedTime(shiftedLocal, this.timeZone);
    return new ZonedDateTime(backToUtc, this.timeZone);
  }

  add() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return {
      milliseconds(n: number): ZonedDateTime {
        return self.addMs(n);
      },
      seconds(n: number): ZonedDateTime {
        return self.addMs(n * 1_000);
      },
      minutes(n: number): ZonedDateTime {
        return self.addMs(n * 60_000);
      },
      hours(n: number): ZonedDateTime {
        return self.addMs(n * 3_600_000);
      },
      days(n: number): ZonedDateTime {
        return self.addDaysCalendar(n);
      },
      weeks(n: number): ZonedDateTime {
        return self.addDaysCalendar(n * 7);
      },
    } as const;
  }

  minus() {
    const builder = this.add();
    return {
      milliseconds: (n: number) => builder.milliseconds(-n),
      seconds: (n: number) => builder.seconds(-n),
      minutes: (n: number) => builder.minutes(-n),
      hours: (n: number) => builder.hours(-n),
      days: (n: number) => builder.days(-n),
      weeks: (n: number) => builder.weeks(-n),
    } as const;
  }

  // Convenience (backward-friendly)
  addMilliseconds(ms: number): ZonedDateTime {
    return this.add().milliseconds(ms);
  }
  addDays(days: number): ZonedDateTime {
    return this.add().days(days);
  }

  startOfDay(): ZonedDateTime {
    const local = toZonedTime(this.utcDate, this.timeZone);
    const localStart = dfStartOfDay(local);
    const utc = fromZonedTime(localStart, this.timeZone);
    return new ZonedDateTime(utc, this.timeZone);
  }

  endOfDay(): ZonedDateTime {
    const local = toZonedTime(this.utcDate, this.timeZone);
    const localEnd = dfEndOfDay(local);
    const utc = fromZonedTime(localEnd, this.timeZone);
    return new ZonedDateTime(utc, this.timeZone);
  }

  format(options?: FormatOptions): string {
    const pattern = options?.pattern ?? options?.preset ?? Format.YMDHH24MISS;
    return formatInTimeZone(this.utcDate, this.timeZone, String(pattern));
  }

  toISO(options?: ToISOOptions): string {
    const fmt = options?.format ?? 'extended';
    const includeOffset = options?.includeOffset ?? true;
    if (includeOffset) {
      const pattern = fmt === 'extended' ? "yyyy-MM-dd'T'HH:mm:ssXXX" : "yyyyMMdd'T'HHmmssXXX";
      return formatInTimeZone(this.utcDate, this.timeZone, pattern);
    }
    // Force UTC Z output
    const pattern = fmt === 'extended' ? "yyyy-MM-dd'T'HH:mm:ss'Z'" : "yyyyMMdd'T'HHmmss'Z'";
    return formatInTimeZone(this.utcDate, 'UTC', pattern);
  }

  toDate(): Date {
    return new Date(this.utcDate.getTime());
  }
}

function hasExplicitOffset(iso: string): boolean {
  // e.g., 2025-08-09T06:45:00Z or 2025-08-09T06:45:00+09:00 / +0900
  return /Z|[+-]\d{2}:?\d{2}$/.test(iso);
}

function ensureDate(input: Date | string | number, timeZoneForNaive: TimeZone): Date {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }
  if (typeof input === 'number') {
    return new Date(input);
  }
  const str = String(input);
  if (hasExplicitOffset(str)) {
    return parseISO(str);
  }
  // Interpret naive string as wall-clock in the given time zone
  // Then convert that local wall time to a UTC instant
  return fromZonedTime(str, timeZoneForNaive);
}
