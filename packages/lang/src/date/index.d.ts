import { addDays, addMilliseconds, differenceInMilliseconds, endOfDay, format, isAfter, isBefore, isValid, isWithinInterval, parseISO, startOfDay, getTime } from 'date-fns';
import { formatInTimeZone, toZonedTime, fromZonedTime } from 'date-fns-tz';
export interface DateFormatOptions {
    pattern?: string;
    timeZone?: string;
}
export declare function formatDate(date: Date | string | number, pattern?: string, timeZone?: string): string;
export declare function toUtc(date: Date | string | number, timeZone?: string): Date;
export declare function toZoned(date: Date | string | number, timeZone: string): Date;
export { addDays, addMilliseconds, differenceInMilliseconds, endOfDay, format, getTime, isAfter, isBefore, isValid, isWithinInterval, parseISO, startOfDay, formatInTimeZone, toZonedTime, fromZonedTime, };
export { ZonedDateTime, Format, type IsoFormat } from './DateTime';
export { type TimeZone, COMMON_TIME_ZONES, asTimeZone } from './timezone';
//# sourceMappingURL=index.d.ts.map