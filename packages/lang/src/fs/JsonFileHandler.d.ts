import { FileOptions } from './FileUtils';
import { Result } from '../utils/safeZone';
export type TypeGuard<T> = (value: unknown) => value is T;
export interface JsonFileOptions extends FileOptions {
    /** JSON 파싱 실패 시 기본값 반환 여부 (default: false) */
    useDefaultOnError?: boolean;
    /** JSON 예쁘게 포맷팅 여부 (default: false) */
    prettyPrint?: boolean;
    /** 들여쓰기 크기 (prettyPrint가 true일 때, default: 2) */
    indent?: number;
    /** JSON.parse reviver 함수 */
    reviver?: (key: string, value: unknown) => unknown;
    /** ISO 8601 날짜 문자열을 Date 객체로 변환 */
    reviveDates?: boolean;
}
/**
 * 타입 안전한 JSON 파일 처리기
 * 제네릭과 타입 가드를 활용한 안전한 JSON 파일 I/O
 */
export declare class JsonFileHandler<T> {
    private readonly filePath;
    private readonly typeGuard?;
    private readonly defaultValue?;
    constructor(filePath: string, typeGuard?: TypeGuard<T> | undefined, defaultValue?: T | undefined);
    /**
     * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
     */
    static create<T>(filePath: string, typeGuard?: TypeGuard<T>, defaultValue?: T): JsonFileHandler<T>;
    /**
     * 파일 존재 여부 확인
     */
    exists(): Promise<boolean>;
    /**
     * 안전한 JSON 파일 읽기
     */
    read(options?: JsonFileOptions): Promise<Result<T>>;
    /**
     * 예외를 발생시키는 JSON 파일 읽기 (기존 API 호환)
     */
    readOrThrow(options?: JsonFileOptions): Promise<T>;
    /**
     * 기본값과 함께 안전한 JSON 파일 읽기
     */
    readWithDefault(fallback: T, options?: JsonFileOptions): Promise<T>;
    /**
     * 안전한 JSON 파일 쓰기
     */
    write(data: T, options?: JsonFileOptions): Promise<Result<void>>;
    /**
     * 파일이 없어도 안전하게 쓰기 (기존 API 호환)
     */
    writeWithEnsure(data: T, options?: JsonFileOptions): Promise<Result<void>>;
    /**
     * 예외를 발생시키는 JSON 파일 쓰기 (기존 API 호환)
     */
    writeOrThrow(data: T, options?: JsonFileOptions): Promise<void>;
    /**
     * 부분 업데이트 (객체 병합)
     */
    update(updater: (current: T) => T | Promise<T>, options?: JsonFileOptions): Promise<Result<T>>;
    /**
     * 파일 삭제
     */
    remove(): Promise<Result<void>>;
    /**
     * 백업 생성
     */
    backup(backupSuffix?: string): Promise<Result<string>>;
}
//# sourceMappingURL=JsonFileHandler.d.ts.map