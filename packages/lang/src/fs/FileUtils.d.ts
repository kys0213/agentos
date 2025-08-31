import fs from 'fs/promises';
import { Result } from '../utils/safeZone';
export interface FileOptions {
    /** 파일이 없을 경우 생성 여부 (default: false) */
    createIfNotExists?: boolean;
    /** 디렉터리가 없을 경우 생성 여부 (default: true) */
    ensureDir?: boolean;
    /** 파일 인코딩 (default: 'utf-8') */
    encoding?: BufferEncoding;
}
export interface DirectoryOptions {
    /** 재귀적으로 디렉터리 생성 여부 (default: true) */
    recursive?: boolean;
}
/**
 * 기본 파일 시스템 유틸리티
 * 모든 파일 I/O 작업의 기반이 되는 클래스
 */
export declare class FileUtils {
    /**
     * 파일 또는 디렉터리 존재 확인
     */
    static exists(filePath: string): Promise<boolean>;
    /**
     * 디렉터리 생성 (재귀적으로)
     */
    static ensureDir(dirPath: string, options?: DirectoryOptions): Promise<Result<void>>;
    /**
     * 안전한 파일 읽기
     */
    static readSafe(filePath: string, options?: FileOptions): Promise<Result<string>>;
    /**
     * 안전한 파일 쓰기
     */
    static writeSafe(filePath: string, content: string, options?: FileOptions): Promise<Result<void>>;
    /**
     * 안전한 파일 추가 (append)
     */
    static appendSafe(filePath: string, content: string, options?: FileOptions): Promise<Result<void>>;
    /**
     * 파일 삭제
     */
    static remove(filePath: string): Promise<Result<void>>;
    /**
     * 파일 통계 정보 가져오기
     */
    static stat(filePath: string): Promise<Result<Awaited<ReturnType<typeof fs.stat>>>>;
    /**
     * 디렉터리 내용 읽기
     */
    static readDir(dirPath: string): Promise<Result<string[]>>;
    /**
     * 파일 복사
     */
    static copy(srcPath: string, destPath: string, options?: FileOptions): Promise<Result<void>>;
}
//# sourceMappingURL=FileUtils.d.ts.map