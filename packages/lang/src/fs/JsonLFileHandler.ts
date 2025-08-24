import readline from 'readline';
import { createReadStream } from 'fs';
import { FileUtils, FileOptions } from './FileUtils';
import { Result } from '../utils/safeZone';
import * as jsonUtils from '../json';
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
export class JsonLFileHandler<T> {
  constructor(
    private readonly filePath: string,
    private readonly typeGuard?: TypeGuard<T>
  ) {}

  /**
   * 팩토리 메서드: 타입 가드와 함께 핸들러 생성
   */
  static create<T>(filePath: string, typeGuard?: TypeGuard<T>): JsonLFileHandler<T> {
    return new JsonLFileHandler(filePath, typeGuard);
  }

  /**
   * 파일 존재 여부 확인
   */
  async exists(): Promise<boolean> {
    return FileUtils.exists(this.filePath);
  }

  /**
   * JSONL 파일 스트리밍 읽기
   */
  async *readStream(options: JsonLFileOptions = {}): AsyncGenerator<Result<T>, void, unknown> {
    const { skipEmptyLines = true, skipInvalidJson = false, chunkSize = 100 } = options;

    if (!(await this.exists())) {
      yield { success: false, reason: new Error(`JSONL file not found: ${this.filePath}`) };
      return;
    }

    const fileStream = createReadStream(this.filePath, { encoding: 'utf-8' });
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    let batch: Result<T>[] = [];
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
        const parseResult = jsonUtils.safeJsonParse<T>(trimmedLine);
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
    } catch (error) {
      yield { success: false, reason: error };
    } finally {
      rl.close();
      fileStream.destroy();
    }
  }

  /**
   * 전체 JSONL 파일을 배열로 읽기
   */
  async readAll(options: JsonLFileOptions = {}): Promise<Result<T[]>> {
    const results: T[] = [];
    const errors: Error[] = [];

    try {
      for await (const result of this.readStream(options)) {
        if (result.success) {
          results.push(result.result);
        } else {
          errors.push(result.reason as Error);
        }
      }

      if (errors.length > 0 && !options.skipInvalidJson) {
        return {
          success: false,
          reason: new Error(`Failed to read JSONL: ${errors.length} errors encountered`),
        };
      }

      return { success: true, result: results };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 여러 항목을 JSONL 파일에 추가
   */
  async appendMany(items: T[], options: JsonLFileOptions = {}): Promise<Result<void>> {
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

      const appendResult = await FileUtils.appendSafe(this.filePath, lines, {
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
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 단일 항목을 JSONL 파일에 추가
   */
  async append(item: T, options: JsonLFileOptions = {}): Promise<Result<void>> {
    return this.appendMany([item], options);
  }

  /**
   * AsyncIterable을 JSONL 파일로 스트리밍 쓰기
   */
  async writeStream(
    items: AsyncIterable<T>,
    options: JsonLFileOptions = {}
  ): Promise<Result<JsonLStats>> {
    const { chunkSize = 100, batchDelay = 0 } = options;

    const stats: JsonLStats = {
      totalLines: 0,
      validJsonLines: 0,
      invalidJsonLines: 0,
      emptyLines: 0,
    };

    try {
      // 파일 초기화 (기존 내용 삭제)
      const writeResult = await FileUtils.writeSafe(this.filePath, '', options);
      if (!writeResult.success) {
        return { success: false, reason: writeResult.reason };
      }

      const batch: T[] = [];

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
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * JSONL 파일 통계 정보 수집
   */
  async getStats(options: JsonLFileOptions = {}): Promise<Result<JsonLStats>> {
    const stats: JsonLStats = {
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
          } else {
            stats.invalidJsonLines++;
          }
        } else {
          stats.validJsonLines++;
        }
      }

      return { success: true, result: stats };
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
   * 필터 조건에 맞는 라인들만 새 파일로 복사
   */
  async filter(
    predicate: (item: T) => boolean | Promise<boolean>,
    outputPath: string,
    options: JsonLFileOptions = {}
  ): Promise<Result<JsonLStats>> {
    const outputHandler = new JsonLFileHandler<T>(outputPath, this.typeGuard);
    const stats: JsonLStats = {
      totalLines: 0,
      validJsonLines: 0,
      invalidJsonLines: 0,
      emptyLines: 0,
    };

    try {
      const batch: T[] = [];
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
    } catch (error) {
      return { success: false, reason: error };
    }
  }
}
