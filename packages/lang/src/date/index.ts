import {
  addDays,
  addMilliseconds,
  differenceInMilliseconds,
  endOfDay,
  format,
  isAfter,
  isBefore,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
  getTime,
} from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';

export interface DateFormatOptions {
  pattern?: string;
  timeZone?: string;
}

function toDate(input: Date | string | number): Date {
  if (input instanceof Date) return input;
  if (typeof input === 'string') return parseISO(input);
  return new Date(input);
}

export function formatDate(
  date: Date | string | number,
  pattern: string = 'yyyy-MM-dd HH:mm:ss',
  timeZone?: string
): string {
  const d = toDate(date);
  return timeZone ? formatInTimeZone(d, timeZone, pattern) : format(d, pattern);
}

export function toUtc(date: Date | string | number, timeZone?: string): Date {
  const d = toDate(date);
  return timeZone ? fromZonedTime(d, timeZone) : new Date(d.getTime());
}

export function toZoned(date: Date | string | number, timeZone: string): Date {
  const d = toDate(date);
  return toZonedTime(d, timeZone);
}

export {
  // date-fns
  addDays,
  addMilliseconds,
  differenceInMilliseconds,
  endOfDay,
  format,
  getTime,
  isAfter,
  isBefore,
  isValid,
  isWithinInterval,
  parseISO,
  startOfDay,
  // date-fns-tz
  formatInTimeZone,
  toZonedTime,
  fromZonedTime,
};

export { ZonedDateTime, Format, type IsoFormat } from './DateTime';
export { type TimeZone, COMMON_TIME_ZONES, asTimeZone } from './timezone';
