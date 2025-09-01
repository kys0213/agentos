// Typed time zone support with common literal union and a branded fallback

// Frequently used IANA time zones to enable literal type inference
export const COMMON_TIME_ZONES = [
  'UTC',
  'Asia/Seoul',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/London',
  'Europe/Berlin',
] as const;

export type CommonTimeZone = (typeof COMMON_TIME_ZONES)[number];

// Brand to represent any valid IANA zone beyond the common set
export type BrandedTimeZone = string & { readonly __brand: 'TimeZone' };

// Public type: either one of the common literals or a branded validated string
export type TimeZone = CommonTimeZone | BrandedTimeZone;

export function isValidTimeZone(zoneId: string): boolean {
  try {
    // Prefer spec API if available (Node 20+/modern runtimes)
    type IntlWithSupportedValues = typeof Intl & {
      supportedValuesOf?: (key: 'timeZone') => readonly string[];
    };
    const intl = Intl as IntlWithSupportedValues;
    if (typeof intl.supportedValuesOf === 'function') {
      const list = intl.supportedValuesOf('timeZone');
      return list.includes(zoneId);
    }
    // Fallback heuristic: attempt DateTimeFormat with the zone
    new Intl.DateTimeFormat('en-US', { timeZone: zoneId }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function asTimeZone(zoneId: string): TimeZone {
  if (COMMON_TIME_ZONES.includes(zoneId as CommonTimeZone)) {
    return zoneId as CommonTimeZone;
  }
  if (!isValidTimeZone(zoneId)) {
    throw new Error(`Invalid IANA time zone: ${zoneId}`);
  }
  return zoneId as BrandedTimeZone;
}
