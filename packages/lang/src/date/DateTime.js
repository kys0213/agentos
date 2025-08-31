"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZonedDateTime = exports.Format = void 0;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
var Format;
(function (Format) {
    Format["YMD"] = "yyyy-MM-dd";
    Format["YMDHH24"] = "yyyy-MM-dd HH:mm";
    Format["YMDHH24MISS"] = "yyyy-MM-dd HH:mm:ss";
    Format["ISO8601_OFFSET"] = "yyyy-MM-dd'T'HH:mm:ssXXX";
    Format["ISO8601_BASIC_Z"] = "yyyyMMdd'T'HHmmss'Z'";
})(Format || (exports.Format = Format = {}));
class ZonedDateTime {
    utcDate;
    timeZone;
    constructor(utcDate, timeZone) {
        this.utcDate = utcDate;
        this.timeZone = timeZone;
    }
    // Factory
    static now(timeZone = 'UTC') {
        return new ZonedDateTime(new Date(), timeZone);
    }
    static valueOf(input, timeZone = 'UTC') {
        const utc = ensureDate(input, timeZone);
        return new ZonedDateTime(utc, timeZone);
    }
    static fromISO(iso, defaultTimeZone = 'UTC') {
        const utc = ensureDate(iso, defaultTimeZone);
        return new ZonedDateTime(utc, defaultTimeZone);
    }
    // Comparisons (compare instants in UTC)
    isBefore(other) {
        return (0, date_fns_1.isBefore)(this.utcDate, other.utcDate);
    }
    isAfter(other) {
        return (0, date_fns_1.isAfter)(this.utcDate, other.utcDate);
    }
    isBetween(start, end, inclusive = '[]') {
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
    withTimeZone(timeZone) {
        return new ZonedDateTime(new Date(this.utcDate.getTime()), timeZone);
    }
    // Absolute time arithmetic (UTC-based)
    addMs(ms) {
        return new ZonedDateTime((0, date_fns_1.addMilliseconds)(this.utcDate, ms), this.timeZone);
    }
    // Calendar arithmetic in the configured time zone
    addDaysCalendar(days) {
        const local = (0, date_fns_tz_1.toZonedTime)(this.utcDate, this.timeZone);
        const shiftedLocal = (0, date_fns_1.addDays)(local, days);
        const backToUtc = (0, date_fns_tz_1.fromZonedTime)(shiftedLocal, this.timeZone);
        return new ZonedDateTime(backToUtc, this.timeZone);
    }
    add() {
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        return {
            milliseconds(n) {
                return self.addMs(n);
            },
            seconds(n) {
                return self.addMs(n * 1_000);
            },
            minutes(n) {
                return self.addMs(n * 60_000);
            },
            hours(n) {
                return self.addMs(n * 3_600_000);
            },
            days(n) {
                return self.addDaysCalendar(n);
            },
            weeks(n) {
                return self.addDaysCalendar(n * 7);
            },
        };
    }
    minus() {
        const builder = this.add();
        return {
            milliseconds: (n) => builder.milliseconds(-n),
            seconds: (n) => builder.seconds(-n),
            minutes: (n) => builder.minutes(-n),
            hours: (n) => builder.hours(-n),
            days: (n) => builder.days(-n),
            weeks: (n) => builder.weeks(-n),
        };
    }
    // Convenience (backward-friendly)
    addMilliseconds(ms) {
        return this.add().milliseconds(ms);
    }
    addDays(days) {
        return this.add().days(days);
    }
    startOfDay() {
        const local = (0, date_fns_tz_1.toZonedTime)(this.utcDate, this.timeZone);
        const localStart = (0, date_fns_1.startOfDay)(local);
        const utc = (0, date_fns_tz_1.fromZonedTime)(localStart, this.timeZone);
        return new ZonedDateTime(utc, this.timeZone);
    }
    endOfDay() {
        const local = (0, date_fns_tz_1.toZonedTime)(this.utcDate, this.timeZone);
        const localEnd = (0, date_fns_1.endOfDay)(local);
        const utc = (0, date_fns_tz_1.fromZonedTime)(localEnd, this.timeZone);
        return new ZonedDateTime(utc, this.timeZone);
    }
    format(options) {
        const pattern = options?.pattern ?? options?.preset ?? Format.YMDHH24MISS;
        return (0, date_fns_tz_1.formatInTimeZone)(this.utcDate, this.timeZone, String(pattern));
    }
    toISO(options) {
        const fmt = options?.format ?? 'extended';
        const includeOffset = options?.includeOffset ?? true;
        if (includeOffset) {
            const pattern = fmt === 'extended' ? "yyyy-MM-dd'T'HH:mm:ssXXX" : "yyyyMMdd'T'HHmmssXXX";
            return (0, date_fns_tz_1.formatInTimeZone)(this.utcDate, this.timeZone, pattern);
        }
        // Force UTC Z output
        const pattern = fmt === 'extended' ? "yyyy-MM-dd'T'HH:mm:ss'Z'" : "yyyyMMdd'T'HHmmss'Z'";
        return (0, date_fns_tz_1.formatInTimeZone)(this.utcDate, 'UTC', pattern);
    }
    toDate() {
        return new Date(this.utcDate.getTime());
    }
}
exports.ZonedDateTime = ZonedDateTime;
function hasExplicitOffset(iso) {
    // e.g., 2025-08-09T06:45:00Z or 2025-08-09T06:45:00+09:00 / +0900
    return /Z|[+-]\d{2}:?\d{2}$/.test(iso);
}
function ensureDate(input, timeZoneForNaive) {
    if (input instanceof Date) {
        return new Date(input.getTime());
    }
    if (typeof input === 'number') {
        return new Date(input);
    }
    const str = String(input);
    if (hasExplicitOffset(str)) {
        return (0, date_fns_1.parseISO)(str);
    }
    // Interpret naive string as wall-clock in the given time zone
    // Then convert that local wall time to a UTC instant
    return (0, date_fns_tz_1.fromZonedTime)(str, timeZoneForNaive);
}
//# sourceMappingURL=DateTime.js.map