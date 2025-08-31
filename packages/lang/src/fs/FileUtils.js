"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUtils = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
/**
 * 기본 파일 시스템 유틸리티
 * 모든 파일 I/O 작업의 기반이 되는 클래스
 */
class FileUtils {
    /**
     * 파일 또는 디렉터리 존재 확인
     */
    static async exists(filePath) {
        try {
            await promises_1.default.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 디렉터리 생성 (재귀적으로)
     */
    static async ensureDir(dirPath, options = {}) {
        const { recursive = true } = options;
        try {
            await promises_1.default.mkdir(dirPath, { recursive });
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 안전한 파일 읽기
     */
    static async readSafe(filePath, options = {}) {
        const { encoding = 'utf-8', createIfNotExists = false, ensureDir = true } = options;
        try {
            // 디렉터리 확인 및 생성
            if (ensureDir) {
                const dirPath = path_1.default.dirname(filePath);
                const dirResult = await this.ensureDir(dirPath);
                if (!dirResult.success) {
                    return { success: false, reason: dirResult.reason };
                }
            }
            // 파일이 없고 생성 옵션이 true인 경우
            if (!(await this.exists(filePath)) && createIfNotExists) {
                const writeResult = await this.writeSafe(filePath, '', options);
                if (!writeResult.success) {
                    return { success: false, reason: writeResult.reason };
                }
            }
            const content = await promises_1.default.readFile(filePath, encoding);
            return { success: true, result: content };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 안전한 파일 쓰기
     */
    static async writeSafe(filePath, content, options = {}) {
        const { encoding = 'utf-8', ensureDir = true } = options;
        try {
            // 디렉터리 확인 및 생성
            if (ensureDir) {
                const dirPath = path_1.default.dirname(filePath);
                const dirResult = await this.ensureDir(dirPath);
                if (!dirResult.success) {
                    return { success: false, reason: dirResult.reason };
                }
            }
            await promises_1.default.writeFile(filePath, content, encoding);
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 안전한 파일 추가 (append)
     */
    static async appendSafe(filePath, content, options = {}) {
        const { encoding = 'utf-8', ensureDir = true, createIfNotExists = true } = options;
        try {
            // 디렉터리 확인 및 생성
            if (ensureDir) {
                const dirPath = path_1.default.dirname(filePath);
                const dirResult = await this.ensureDir(dirPath);
                if (!dirResult.success) {
                    return { success: false, reason: dirResult.reason };
                }
            }
            // 파일이 없고 생성 옵션이 true인 경우
            if (!(await this.exists(filePath)) && createIfNotExists) {
                const writeResult = await this.writeSafe(filePath, '', options);
                if (!writeResult.success) {
                    return { success: false, reason: writeResult.reason };
                }
            }
            await promises_1.default.appendFile(filePath, content, encoding);
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 파일 삭제
     */
    static async remove(filePath) {
        try {
            if (await this.exists(filePath)) {
                await promises_1.default.unlink(filePath);
            }
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 파일 통계 정보 가져오기
     */
    static async stat(filePath) {
        try {
            const stats = await promises_1.default.stat(filePath);
            return { success: true, result: stats };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 디렉터리 내용 읽기
     */
    static async readDir(dirPath) {
        try {
            const entries = await promises_1.default.readdir(dirPath);
            return { success: true, result: entries };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 파일 복사
     */
    static async copy(srcPath, destPath, options = {}) {
        const { ensureDir = true } = options;
        try {
            // 대상 디렉터리 확인 및 생성
            if (ensureDir) {
                const dirPath = path_1.default.dirname(destPath);
                const dirResult = await this.ensureDir(dirPath);
                if (!dirResult.success) {
                    return { success: false, reason: dirResult.reason };
                }
            }
            await promises_1.default.copyFile(srcPath, destPath);
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
}
exports.FileUtils = FileUtils;
//# sourceMappingURL=FileUtils.js.map