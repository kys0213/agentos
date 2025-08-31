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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFileHandler = void 0;
const FileUtils_1 = require("./FileUtils");
const jsonUtils = __importStar(require("../json"));
/**
 * 타입 안전한 JSON 파일 처리기
 * 제네릭과 타입 가드를 활용한 안전한 JSON 파일 I/O
 */
class JsonFileHandler {
    filePath;
    typeGuard;
    defaultValue;
    constructor(filePath, typeGuard, defaultValue) {
        this.filePath = filePath;
        this.typeGuard = typeGuard;
        this.defaultValue = defaultValue;
    }
    /**
     * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
     */
    static create(filePath, typeGuard, defaultValue) {
        return new JsonFileHandler(filePath, typeGuard, defaultValue);
    }
    /**
     * 파일 존재 여부 확인
     */
    async exists() {
        return FileUtils_1.FileUtils.exists(this.filePath);
    }
    /**
     * 안전한 JSON 파일 읽기
     */
    async read(options = {}) {
        const { useDefaultOnError = false, reviver, reviveDates = false } = options;
        const readResult = await FileUtils_1.FileUtils.readSafe(this.filePath, options);
        if (!readResult.success) {
            if (useDefaultOnError && this.defaultValue !== undefined) {
                return { success: true, result: this.defaultValue };
            }
            return { success: false, reason: readResult.reason };
        }
        const content = readResult.result.trim();
        if (!content) {
            if (useDefaultOnError && this.defaultValue !== undefined) {
                return { success: true, result: this.defaultValue };
            }
            return { success: false, reason: new Error('Empty JSON file') };
        }
        const parseResult = reviver || reviveDates
            ? jsonUtils.safeJsonParseWithReviver(content, reviver ?? jsonUtils.dateReviver)
            : jsonUtils.safeJsonParse(content);
        if (!parseResult.success) {
            if (useDefaultOnError && this.defaultValue !== undefined) {
                return { success: true, result: this.defaultValue };
            }
            return { success: false, reason: parseResult.reason };
        }
        // 타입 가드 검증
        if (this.typeGuard && !this.typeGuard(parseResult.result)) {
            if (useDefaultOnError && this.defaultValue !== undefined) {
                return { success: true, result: this.defaultValue };
            }
            return {
                success: false,
                reason: new Error('JSON data does not match expected type schema'),
            };
        }
        return { success: true, result: parseResult.result };
    }
    /**
     * 예외를 발생시키는 JSON 파일 읽기 (기존 API 호환)
     */
    async readOrThrow(options = {}) {
        const result = await this.read(options);
        if (!result.success) {
            throw new Error(`Failed to read JSON file: ${String(result.reason)}`);
        }
        return result.result;
    }
    /**
     * 기본값과 함께 안전한 JSON 파일 읽기
     */
    async readWithDefault(fallback, options = {}) {
        const result = await this.read({ ...options, useDefaultOnError: true });
        return result.success ? result.result : fallback;
    }
    /**
     * 안전한 JSON 파일 쓰기
     */
    async write(data, options = {}) {
        const { prettyPrint = false, indent = 2 } = options;
        // 타입 가드 검증
        if (this.typeGuard && !this.typeGuard(data)) {
            return {
                success: false,
                reason: new Error('Data does not match expected type schema'),
            };
        }
        try {
            const jsonString = prettyPrint ? JSON.stringify(data, null, indent) : JSON.stringify(data);
            return await FileUtils_1.FileUtils.writeSafe(this.filePath, jsonString, options);
        }
        catch (error) {
            return { success: false, reason: error };
        }
    }
    /**
     * 파일이 없어도 안전하게 쓰기 (기존 API 호환)
     */
    async writeWithEnsure(data, options = {}) {
        return this.write(data, { ...options, createIfNotExists: true });
    }
    /**
     * 예외를 발생시키는 JSON 파일 쓰기 (기존 API 호환)
     */
    async writeOrThrow(data, options = {}) {
        const result = await this.write(data, options);
        if (!result.success) {
            throw new Error(`Failed to write JSON file: ${String(result.reason)}`);
        }
    }
    /**
     * 부분 업데이트 (객체 병합)
     */
    async update(updater, options = {}) {
        const readResult = await this.read({ ...options, useDefaultOnError: true });
        if (!readResult.success) {
            return { success: false, reason: readResult.reason };
        }
        try {
            const updatedData = await updater(readResult.result);
            const writeResult = await this.write(updatedData, options);
            if (!writeResult.success) {
                return { success: false, reason: writeResult.reason };
            }
            return { success: true, result: updatedData };
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
     * 백업 생성
     */
    async backup(backupSuffix = '.backup') {
        const backupPath = this.filePath + backupSuffix;
        const copyResult = await FileUtils_1.FileUtils.copy(this.filePath, backupPath);
        if (!copyResult.success) {
            return { success: false, reason: copyResult.reason };
        }
        return { success: true, result: backupPath };
    }
}
exports.JsonFileHandler = JsonFileHandler;
//# sourceMappingURL=JsonFileHandler.js.map