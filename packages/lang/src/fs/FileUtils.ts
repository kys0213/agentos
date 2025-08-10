import fs from 'fs/promises';
import path from 'path';
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
export class FileUtils {
  /**
   * 파일 또는 디렉터리 존재 확인
   */
  static async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 디렉터리 생성 (재귀적으로)
   */
  static async ensureDir(dirPath: string, options: DirectoryOptions = {}): Promise<Result<void>> {
    const { recursive = true } = options;

    try {
      await fs.mkdir(dirPath, { recursive });
      return { success: true, result: undefined };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 안전한 파일 읽기
   */
  static async readSafe(filePath: string, options: FileOptions = {}): Promise<Result<string>> {
    const { encoding = 'utf-8', createIfNotExists = false, ensureDir = true } = options;

    try {
      // 디렉터리 확인 및 생성
      if (ensureDir) {
        const dirPath = path.dirname(filePath);
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

      const content = await fs.readFile(filePath, encoding);
      return { success: true, result: content };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 안전한 파일 쓰기
   */
  static async writeSafe(
    filePath: string,
    content: string,
    options: FileOptions = {}
  ): Promise<Result<void>> {
    const { encoding = 'utf-8', ensureDir = true } = options;

    try {
      // 디렉터리 확인 및 생성
      if (ensureDir) {
        const dirPath = path.dirname(filePath);
        const dirResult = await this.ensureDir(dirPath);
        if (!dirResult.success) {
          return { success: false, reason: dirResult.reason };
        }
      }

      await fs.writeFile(filePath, content, encoding);
      return { success: true, result: undefined };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 안전한 파일 추가 (append)
   */
  static async appendSafe(
    filePath: string,
    content: string,
    options: FileOptions = {}
  ): Promise<Result<void>> {
    const { encoding = 'utf-8', ensureDir = true, createIfNotExists = true } = options;

    try {
      // 디렉터리 확인 및 생성
      if (ensureDir) {
        const dirPath = path.dirname(filePath);
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

      await fs.appendFile(filePath, content, encoding);
      return { success: true, result: undefined };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 파일 삭제
   */
  static async remove(filePath: string): Promise<Result<void>> {
    try {
      if (await this.exists(filePath)) {
        await fs.unlink(filePath);
      }
      return { success: true, result: undefined };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 파일 통계 정보 가져오기
   */
  static async stat(filePath: string): Promise<Result<fs.Stats>> {
    try {
      const stats = await fs.stat(filePath);
      return { success: true, result: stats };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 디렉터리 내용 읽기
   */
  static async readDir(dirPath: string): Promise<Result<string[]>> {
    try {
      const entries = await fs.readdir(dirPath);
      return { success: true, result: entries };
    } catch (error) {
      return { success: false, reason: error };
    }
  }

  /**
   * 파일 복사
   */
  static async copy(srcPath: string, destPath: string, options: FileOptions = {}): Promise<Result<void>> {
    const { ensureDir = true } = options;

    try {
      // 대상 디렉터리 확인 및 생성
      if (ensureDir) {
        const dirPath = path.dirname(destPath);
        const dirResult = await this.ensureDir(dirPath);
        if (!dirResult.success) {
          return { success: false, reason: dirResult.reason };
        }
      }

      await fs.copyFile(srcPath, destPath);
      return { success: true, result: undefined };
    } catch (error) {
      return { success: false, reason: error };
    }
  }
}