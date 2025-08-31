import { FileOptions } from './FileUtils';
import { Result } from '../utils/safeZone';
import { TypeGuard } from './JsonFileHandler';
export interface JsonLFileOptions extends FileOptions {
    /** 스트리밍 읽기 시 청크 크기 (default: 100) */
    chunkSize?: number;
    /** 빈 라인 무시 여부 (default: true) */
    skipEmptyLines?: boolean;
    /** 잘못된 JSON 라인 무시 여부 (default: false) */
    skipInvalidJson?: boolean;
    /** 배치 처리 시 지연 시간 ms (default: 0) */
    batchDelay?: number;
}
export interface JsonLStats {
    totalLines: number;
    validJsonLines: number;
    invalidJsonLines: number;
    emptyLines: number;
}
/**
 * JSONL(JSON Lines) 파일 스트리밍 처리기
 * 대용량 JSONL 파일의 효율적인 읽기/쓰기 지원
 */
export declare class JsonLFileHandler<T> {
    private readonly filePath;
    private readonly typeGuard?;
    constructor(filePath: string, typeGuard?: TypeGuard<T> | undefined);
    /**
     * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
     */
    static create<T>(filePath: string, typeGuard?: TypeGuard<T>): JsonLFileHandler<T>;
    /**
     * 파일 존재 여부 확인
     */
    exists(): Promise<boolean>;
    /**
     * JSONL 파일 스트리밍 읽기
     */
    readStream(options?: JsonLFileOptions): AsyncGenerator<Result<T>, void, unknown>;
    /**
     * 전체 JSONL 파일을 배열로 읽기
     */
    readAll(options?: JsonLFileOptions): Promise<Result<T[]>>;
    /**
     * 여러 항목을 JSONL 파일에 추가
     */
    appendMany(items: T[], options?: JsonLFileOptions): Promise<Result<void>>;
    /**
     * 단일 항목을 JSONL 파일에 추가
     */
    append(item: T, options?: JsonLFileOptions): Promise<Result<void>>;
    /**
     * AsyncIterable을 JSONL 파일로 스트리밍 쓰기
     */
    writeStream(items: AsyncIterable<T>, options?: JsonLFileOptions): Promise<Result<JsonLStats>>;
    /**
     * JSONL 파일 통계 정보 수집
     */
    getStats(options?: JsonLFileOptions): Promise<Result<JsonLStats>>;
    /**
     * 파일 삭제
     */
    remove(): Promise<Result<void>>;
    /**
     * 필터 조건에 맞는 라인들만 새 파일로 복사
     */
    filter(predicate: (item: T) => boolean | Promise<boolean>, outputPath: string, options?: JsonLFileOptions): Promise<Result<JsonLStats>>;
}
//# sourceMappingURL=JsonLFileHandler.d.ts.map