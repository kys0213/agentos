export interface IdentifierValidationOptions {
    /** 최소 길이 (default: 2) */
    minLength?: number;
    /** 최대 길이 (default: 64) */
    maxLength?: number;
    /** 커스텀 패턴 (default: alphanumeric + ._-) */
    pattern?: RegExp;
    /** 유니코드 문자 허용 여부 (default: false) */
    allowUnicode?: boolean;
    /** 시작/끝 문자 제한 (default: alphanumeric only) */
    requireAlphanumericEnds?: boolean;
}
/**
 * 범용 식별자 유효성 검증
 * Agent ID, Session ID, Tool ID 등 다양한 식별자에 활용 가능
 */
export declare function validateIdentifier(id: string, options?: IdentifierValidationOptions): boolean;
/**
 * Agent ID 전용 검증 (기존 호환성 유지)
 */
export declare function validateAgentId(agentId: string): boolean;
/**
 * Session ID 검증 (더 유연한 규칙)
 */
export declare function validateSessionId(sessionId: string): boolean;
/**
 * Tool ID 검증 (유니코드 허용)
 */
export declare function validateToolId(toolId: string): boolean;
//# sourceMappingURL=identifier.d.ts.map