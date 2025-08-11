import { FileUtils, FileOptions } from './FileUtils';
import { Result } from '../utils/safeZone';
import * as jsonUtils from '../json';

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
export class JsonFileHandler<T> {
  constructor(
    private readonly filePath: string,
    private readonly typeGuard?: TypeGuard<T>,
    private readonly defaultValue?: T
  ) {}

  /**
   * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
   */
  static create<T>(
    filePath: string,
    typeGuard?: TypeGuard<T>,
    defaultValue?: T
  ): JsonFileHandler<T> {
    return new JsonFileHandler(filePath, typeGuard, defaultValue);
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(): Promise<boolean> {
    return FileUtils.exists(this.filePath);
  }

  /**
   * 안전한 JSON 파일 읽기
   */
  async read(options: JsonFileOptions = {}): Promise<Result<T>> {
    const { useDefaultOnError = false, reviver, reviveDates = false } = options;

    const readResult = await FileUtils.readSafe(this.filePath, options);

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

    const parseResult =
      reviver || reviveDates
        ? jsonUtils.safeJsonParseWithReviver<T>(
            content,
            reviver ?? jsonUtils.dateReviver,
          )
        : jsonUtils.safeJsonParse<T>(content);
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
  async readOrThrow(options: JsonFileOptions = {}): Promise<T> {
    const result = await this.read(options);
    if (!result.success) {
      throw new Error(`Failed to read JSON file: ${String(result.reason)}`);
    }
    return result.result;
  }

  /**
   * 기본값과 함께 안전한 JSON 파일 읽기
   */
  async readWithDefault(fallback: T, options: JsonFileOptions = {}): Promise<T> {
    const result = await this.read({ ...options, useDefaultOnError: true });
    return result.success ? result.result : fallback;
  }

  /**
   * 안전한 JSON 파일 쓰기
   */
  async write(data: T, options: JsonFileOptions = {}): Promise<Result<void>> {
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

      return await FileUtils.writeSafe(this.filePath, jsonString, options);
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 파일이 없어도 안전하게 쓰기 (기존 API 호환)
   */
  async writeWithEnsure(data: T, options: JsonFileOptions = {}): Promise<Result<void>> {
    return this.write(data, { ...options, createIfNotExists: true });
  }

  /**
   * 예외를 발생시키는 JSON 파일 쓰기 (기존 API 호환)
   */
  async writeOrThrow(data: T, options: JsonFileOptions = {}): Promise<void> {
    const result = await this.write(data, options);
    if (!result.success) {
      throw new Error(`Failed to write JSON file: ${String(result.reason)}`);
    }
  }

  /**
   * 부분 업데이트 (객체 병합)
   */
  async update(
    updater: (current: T) => T | Promise<T>,
    options: JsonFileOptions = {}
  ): Promise<Result<T>> {
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
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 파일 삭제
   */
  async remove(): Promise<Result<void>> {
    return FileUtils.remove(this.filePath);
  }

  /**
   * 백업 생성
   */
  async backup(backupSuffix = '.backup'): Promise<Result<string>> {
    const backupPath = this.filePath + backupSuffix;
    const copyResult = await FileUtils.copy(this.filePath, backupPath);

    if (!copyResult.success) {
      return { success: false, reason: copyResult.reason };
    }

    return { success: true, result: backupPath };
  }
}
