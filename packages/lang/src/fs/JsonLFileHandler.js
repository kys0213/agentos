"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLFileHandler = void 0;
const readline_1 = __importDefault(require("readline"));
const fs_1 = require("fs");
const FileUtils_1 = require("./FileUtils");
const jsonUtils = __importStar(require("../json"));
/**
 * JSONL(JSON Lines) 파일 스트리밍 처리기
 * 대용량 JSONL 파일의 효율적인 읽기/쓰기 지원
 */
class JsonLFileHandler {
    filePath;
    typeGuard;
    constructor(filePath, typeGuard) {
        this.filePath = filePath;
        this.typeGuard = typeGuard;
    }
    /**
     * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
     */
    static create(filePath, typeGuard) {
        return new JsonLFileHandler(filePath, typeGuard);
    }
    /**
     * 파일 존재 여부 확인
     */
    async exists() {
        return FileUtils_1.FileUtils.exists(this.filePath);
    }
    /**
     * JSONL 파일 스트리밍 읽기
     */
    async *readStream(options = {}) {
        const { skipEmptyLines = true, skipInvalidJson = false, chunkSize = 100 } = options;
        if (!(await this.exists())) {
            yield { success: false, reason: new Error(`JSONL file not found: ${this.filePath}`) };
            return;
        }
        const fileStream = (0, fs_1.createReadStream)(this.filePath, { encoding: 'utf-8' });
        const rl = readline_1.default.createInterface({
            input: fileStream,
            crlfDelay: Infinity,
        });
        let batch = [];
        let lineNumber = 0;
        try {
            for await (const line of rl) {
                lineNumber++;
                const trimmedLine = line.trim();
                // 빈 라인 처리
                if (!trimmedLine) {
                    if (skipEmptyLines) {
                        continue;
                    }
                    yield { success: false, reason: new Error(`Empty line at ${lineNumber}`) };
                    continue;
                }
                // JSON 파싱
                const parseResult = jsonUtils.safeJsonParse(trimmedLine);
                if (!parseResult.success) {
                    if (skipInvalidJson) {
                        continue;
                    }
                    yield {
                        success: false,
                        reason: new Error(`Invalid JSON at line ${lineNumber}: ${String(parseResult.reason)}`),
                    };
                    continue;
                }
                // 타입 가드 검증
                if (this.typeGuard && !this.typeGuard(parseResult.result)) {
                    if (skipInvalidJson) {
                        continue;
                    }
                    yield {
                        success: false,
                        reason: new Error(`Type validation failed at line ${lineNumber}`),
                    };
                    continue;
                }
                batch.push({ success: true, result: parseResult.result });
                // 배치 크기에 도달하면 yield
                if (batch.length >= chunkSize) {
                    for (const item of batch) {
                        yield item;
                    }
                    batch = [];
                }
            }
            // 남은 배치 처리
            for (const item of batch) {
                yield item;
            }
        }
        catch (error) {
            yield { success: false, reason: error };
        }
        finally {
            rl.close();
            fileStream.destroy();
        }
    }
    /**
     * 전체 JSONL 파일을 배열로 읽기
     */
    async readAll(options = {}) {
        const results = [];
        const errors = [];
        try {
            for await (const result of this.readStream(options)) {
                if (result.success) {
                    results.push(result.result);
                }
                else {
                    errors.push(result.reason);
                }
            }
            if (errors.length > 0 && !options.skipInvalidJson) {
                return {
                    success: false,
                    reason: new Error(`Failed to read JSONL: ${errors.length} errors encountered`),
                };
            }
            return { success: true, result: results };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 여러 항목을 JSONL 파일에 추가
     */
    async appendMany(items, options = {}) {
        const { batchDelay = 0 } = options;
        if (items.length === 0) {
            return { success: true, result: undefined };
        }
        // 타입 가드 검증
        if (this.typeGuard) {
            for (let i = 0; i < items.length; i++) {
                if (!this.typeGuard(items[i])) {
                    return {
                        success: false,
                        reason: new Error(`Type validation failed for item at index ${i}`),
                    };
                }
            }
        }
        try {
            const lines = items.map((item) => JSON.stringify(item)).join('\n') + '\n';
            const appendResult = await FileUtils_1.FileUtils.appendSafe(this.filePath, lines, {
                ...options,
                createIfNotExists: true,
            });
            if (!appendResult.success) {
                return { success: false, reason: appendResult.reason };
            }
            // 배치 지연이 설정된 경우
            if (batchDelay > 0) {
                await new Promise((resolve) => setTimeout(resolve, batchDelay));
            }
            return { success: true, result: undefined };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 단일 항목을 JSONL 파일에 추가
     */
    async append(item, options = {}) {
        return this.appendMany([item], options);
    }
    /**
     * AsyncIterable을 JSONL 파일로 스트리밍 쓰기
     */
    async writeStream(items, options = {}) {
        const { chunkSize = 100, batchDelay = 0 } = options;
        const stats = {
            totalLines: 0,
            validJsonLines: 0,
            invalidJsonLines: 0,
            emptyLines: 0,
        };
        try {
            // 파일 초기화 (기존 내용 삭제)
            const writeResult = await FileUtils_1.FileUtils.writeSafe(this.filePath, '', options);
            if (!writeResult.success) {
                return { success: false, reason: writeResult.reason };
            }
            const batch = [];
            for await (const item of items) {
                // 타입 가드 검증
                if (this.typeGuard && !this.typeGuard(item)) {
                    stats.invalidJsonLines++;
                    continue;
                }
                batch.push(item);
                stats.totalLines++;
                // 배치 크기에 도달하면 쓰기
                if (batch.length >= chunkSize) {
                    const appendResult = await this.appendMany(batch, { ...options, batchDelay });
                    if (!appendResult.success) {
                        return { success: false, reason: appendResult.reason };
                    }
                    stats.validJsonLines += batch.length;
                    batch.length = 0; // 배열 초기화
                }
            }
            // 남은 배치 처리
            if (batch.length > 0) {
                const appendResult = await this.appendMany(batch, options);
                if (!appendResult.success) {
                    return { success: false, reason: appendResult.reason };
                }
                stats.validJsonLines += batch.length;
            }
            return { success: true, result: stats };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * JSONL 파일 통계 정보 수집
     */
    async getStats(options = {}) {
        const stats = {
            totalLines: 0,
            validJsonLines: 0,
            invalidJsonLines: 0,
            emptyLines: 0,
        };
        try {
            for await (const result of this.readStream({
                ...options,
                skipInvalidJson: false,
                skipEmptyLines: false,
            })) {
                stats.totalLines++;
                if (!result.success) {
                    const errorMessage = String(result.reason);
                    if (errorMessage.includes('Empty line')) {
                        stats.emptyLines++;
                    }
                    else {
                        stats.invalidJsonLines++;
                    }
                }
                else {
                    stats.validJsonLines++;
                }
            }
            return { success: true, result: stats };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 파일 삭제
     */
    async remove() {
        return FileUtils_1.FileUtils.remove(this.filePath);
    }
    /**
     * 필터 조건에 맞는 라인들만 새 파일로 복사
     */
    async filter(predicate, outputPath, options = {}) {
        const outputHandler = new JsonLFileHandler(outputPath, this.typeGuard);
        const stats = {
            totalLines: 0,
            validJsonLines: 0,
            invalidJsonLines: 0,
            emptyLines: 0,
        };
        try {
            const batch = [];
            const { chunkSize = 100 } = options;
            for await (const result of this.readStream(options)) {
                stats.totalLines++;
                if (!result.success) {
                    stats.invalidJsonLines++;
                    continue;
                }
                const shouldInclude = await predicate(result.result);
                if (shouldInclude) {
                    batch.push(result.result);
                    if (batch.length >= chunkSize) {
                        const appendResult = await outputHandler.appendMany(batch, options);
                        if (!appendResult.success) {
                            return { success: false, reason: appendResult.reason };
                        }
                        stats.validJsonLines += batch.length;
                        batch.length = 0;
                    }
                }
            }
            // 남은 배치 처리
            if (batch.length > 0) {
                const appendResult = await outputHandler.appendMany(batch, options);
                if (!appendResult.success) {
                    return { success: false, reason: appendResult.reason };
                }
                stats.validJsonLines += batch.length;
            }
            return { success: true, result: stats };
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
}
exports.JsonLFileHandler = JsonLFileHandler;
//# sourceMappingURL=JsonLFileHandler.js.map