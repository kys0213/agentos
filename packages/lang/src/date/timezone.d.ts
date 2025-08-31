export declare const COMMON_TIME_ZONES: readonly ["UTC", "Asia/Seoul", "Asia/Tokyo", "Asia/Shanghai", "America/Los_Angeles", "America/New_York", "Europe/London", "Europe/Berlin"];
export type CommonTimeZone = (typeof COMMON_TIME_ZONES)[number];
export type BrandedTimeZone = string & {
    readonly __brand: 'TimeZone';
};
export type TimeZone = CommonTimeZone | BrandedTimeZone;
export declare function isValidTimeZone(zoneId: string): boolean;
export declare function asTimeZone(zoneId: string): TimeZone;
//# sourceMappingURL=timezone.d.ts.map