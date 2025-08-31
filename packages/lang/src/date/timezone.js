"use strict";
// Typed time zone support with common literal union and a branded fallback
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMMON_TIME_ZONES = void 0;
exports.isValidTimeZone = isValidTimeZone;
exports.asTimeZone = asTimeZone;
// Frequently used IANA time zones to enable literal type inference
exports.COMMON_TIME_ZONES = [
    'UTC',
    'Asia/Seoul',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'America/Los_Angeles',
    'America/New_York',
    'Europe/London',
    'Europe/Berlin',
];
function isValidTimeZone(zoneId) {
    try {
        // Prefer spec API if available (Node 20+/modern runtimes)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyIntl = Intl;
        if (typeof anyIntl.supportedValuesOf === 'function') {
            const list = anyIntl.supportedValuesOf('timeZone');
            return list.includes(zoneId);
        }
        // Fallback heuristic: attempt DateTimeFormat with the zone
        new Intl.DateTimeFormat('en-US', { timeZone: zoneId }).format(new Date());
        return true;
    }
    catch {
        return false;
    }
}
function asTimeZone(zoneId) {
    if (exports.COMMON_TIME_ZONES.includes(zoneId)) {
        return zoneId;
    }
    if (!isValidTimeZone(zoneId)) {
        throw new Error(`Invalid IANA time zone: ${zoneId}`);
    }
    return zoneId;
}
//# sourceMappingURL=timezone.js.map