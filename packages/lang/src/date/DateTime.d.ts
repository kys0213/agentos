import { type TimeZone } from './timezone';
export declare enum Format {
    YMD = "yyyy-MM-dd",
    YMDHH24 = "yyyy-MM-dd HH:mm",
    YMDHH24MISS = "yyyy-MM-dd HH:mm:ss",
    ISO8601_OFFSET = "yyyy-MM-dd'T'HH:mm:ssXXX",
    ISO8601_BASIC_Z = "yyyyMMdd'T'HHmmss'Z'"
}
export type IsoFormat = 'extended' | 'basic';
export interface ToISOOptions {
    format?: IsoFormat;
    includeOffset?: boolean;
}
export interface FormatOptions {
    pattern?: string;
    preset?: Format;
}
export declare class ZonedDateTime {
    private readonly utcDate;
    readonly timeZone: TimeZone;
    private constructor();
    static now(timeZone?: TimeZone): ZonedDateTime;
    static valueOf(input: Date | string | number, timeZone?: TimeZone): ZonedDateTime;
    static fromISO(iso: string, defaultTimeZone?: TimeZone): ZonedDateTime;
    isBefore(other: ZonedDateTime): boolean;
    isAfter(other: ZonedDateTime): boolean;
    isBetween(start: ZonedDateTime, end: ZonedDateTime, inclusive?: '()' | '[]' | '[)' | '(]'): boolean;
    withTimeZone(timeZone: TimeZone): ZonedDateTime;
    private addMs;
    private addDaysCalendar;
    add(): {
        readonly milliseconds: (n: number) => ZonedDateTime;
        readonly seconds: (n: number) => ZonedDateTime;
        readonly minutes: (n: number) => ZonedDateTime;
        readonly hours: (n: number) => ZonedDateTime;
        readonly days: (n: number) => ZonedDateTime;
        readonly weeks: (n: number) => ZonedDateTime;
    };
    minus(): {
        readonly milliseconds: (n: number) => ZonedDateTime;
        readonly seconds: (n: number) => ZonedDateTime;
        readonly minutes: (n: number) => ZonedDateTime;
        readonly hours: (n: number) => ZonedDateTime;
        readonly days: (n: number) => ZonedDateTime;
        readonly weeks: (n: number) => ZonedDateTime;
    };
    addMilliseconds(ms: number): ZonedDateTime;
    addDays(days: number): ZonedDateTime;
    startOfDay(): ZonedDateTime;
    endOfDay(): ZonedDateTime;
    format(options?: FormatOptions): string;
    toISO(options?: ToISOOptions): string;
    toDate(): Date;
}
//# sourceMappingURL=DateTime.d.ts.map