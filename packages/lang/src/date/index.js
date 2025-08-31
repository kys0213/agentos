"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asTimeZone = exports.COMMON_TIME_ZONES = exports.Format = exports.ZonedDateTime = exports.fromZonedTime = exports.toZonedTime = exports.formatInTimeZone = exports.startOfDay = exports.parseISO = exports.isWithinInterval = exports.isValid = exports.isBefore = exports.isAfter = exports.getTime = exports.format = exports.endOfDay = exports.differenceInMilliseconds = exports.addMilliseconds = exports.addDays = void 0;
exports.formatDate = formatDate;
exports.toUtc = toUtc;
exports.toZoned = toZoned;
const date_fns_1 = require("date-fns");
Object.defineProperty(exports, "addDays", { enumerable: true, get: function () { return date_fns_1.addDays; } });
Object.defineProperty(exports, "addMilliseconds", { enumerable: true, get: function () { return date_fns_1.addMilliseconds; } });
Object.defineProperty(exports, "differenceInMilliseconds", { enumerable: true, get: function () { return date_fns_1.differenceInMilliseconds; } });
Object.defineProperty(exports, "endOfDay", { enumerable: true, get: function () { return date_fns_1.endOfDay; } });
Object.defineProperty(exports, "format", { enumerable: true, get: function () { return date_fns_1.format; } });
Object.defineProperty(exports, "isAfter", { enumerable: true, get: function () { return date_fns_1.isAfter; } });
Object.defineProperty(exports, "isBefore", { enumerable: true, get: function () { return date_fns_1.isBefore; } });
Object.defineProperty(exports, "isValid", { enumerable: true, get: function () { return date_fns_1.isValid; } });
Object.defineProperty(exports, "isWithinInterval", { enumerable: true, get: function () { return date_fns_1.isWithinInterval; } });
Object.defineProperty(exports, "parseISO", { enumerable: true, get: function () { return date_fns_1.parseISO; } });
Object.defineProperty(exports, "startOfDay", { enumerable: true, get: function () { return date_fns_1.startOfDay; } });
Object.defineProperty(exports, "getTime", { enumerable: true, get: function () { return date_fns_1.getTime; } });
const date_fns_tz_1 = require("date-fns-tz");
Object.defineProperty(exports, "formatInTimeZone", { enumerable: true, get: function () { return date_fns_tz_1.formatInTimeZone; } });
Object.defineProperty(exports, "toZonedTime", { enumerable: true, get: function () { return date_fns_tz_1.toZonedTime; } });
Object.defineProperty(exports, "fromZonedTime", { enumerable: true, get: function () { return date_fns_tz_1.fromZonedTime; } });
function toDate(input) {
    if (input instanceof Date) {
        return input;
    }
    if (typeof input === 'string') {
        return (0, date_fns_1.parseISO)(input);
    }
    return new Date(input);
}
function formatDate(date, pattern = 'yyyy-MM-dd HH:mm:ss', timeZone) {
    const d = toDate(date);
    return timeZone ? (0, date_fns_tz_1.formatInTimeZone)(d, timeZone, pattern) : (0, date_fns_1.format)(d, pattern);
}
function toUtc(date, timeZone) {
    const d = toDate(date);
    return timeZone ? (0, date_fns_tz_1.fromZonedTime)(d, timeZone) : new Date(d.getTime());
}
function toZoned(date, timeZone) {
    const d = toDate(date);
    return (0, date_fns_tz_1.toZonedTime)(d, timeZone);
}
var DateTime_1 = require("./DateTime");
Object.defineProperty(exports, "ZonedDateTime", { enumerable: true, get: function () { return DateTime_1.ZonedDateTime; } });
Object.defineProperty(exports, "Format", { enumerable: true, get: function () { return DateTime_1.Format; } });
var timezone_1 = require("./timezone");
Object.defineProperty(exports, "COMMON_TIME_ZONES", { enumerable: true, get: function () { return timezone_1.COMMON_TIME_ZONES; } });
Object.defineProperty(exports, "asTimeZone", { enumerable: true, get: function () { return timezone_1.asTimeZone; } });
//# sourceMappingURL=index.js.map