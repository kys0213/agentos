import type { IpcChannel } from './IpcChannel';

import { ElectronIpcChannel } from './ElectronIpcChannel';
import { WebIpcChannel } from './WebIpcChannel';
import { ChromeExtensionIpcChannel } from './ChromeExtensionIpcChannel';
import { MockIpcChannel } from './MockIpcChannel';

// 테스트 및 Chrome Extension API 타입 선언
declare const global: {
  chrome: {
    runtime: {
      id?: string;
    };
  };
};

declare const vi: any;
declare const jest: any;

/**
 * 환경별 IpcChannel 구현체를 생성하는 팩토리 클래스
 * 런타임에 현재 환경을 감지하여 적절한 구현체를 반환
 */
export class IpcChannelFactory {
  private static _instance: IpcChannel | null = null;

  /**
   * 현재 환경에 맞는 IpcChannel 구현체를 생성하여 반환
   * 싱글톤 패턴으로 한 번 생성된 인스턴스를 재사용
   */
  static create(): IpcChannel {
    if (this._instance) {
      return this._instance;
    }

    const environment = this.detectEnvironment();
    const envInfo = this.getEnvironmentInfo();
    console.log(`Detected environment: ${environment}`, envInfo);

    switch (environment) {
      case 'electron':
        this._instance = new ElectronIpcChannel();
        break;

      case 'chrome-extension':
        this._instance = new ChromeExtensionIpcChannel();
        break;

      case 'test':
        this._instance = new MockIpcChannel();
        break;

      case 'web':
        // web 환경에서는 실제 백엔드 서버와 연결할 WebIpcChannel을 사용
        // 개발 중에는 MockIpcChannel 사용 (환경변수로 제어)
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          this._instance = new MockIpcChannel();
        } else {
          this._instance = new WebIpcChannel();
        }
        break;
      default:
        this._instance = new MockIpcChannel();
        break;
    }

    return this._instance;
  }

  /**
   * 특정 구현체를 강제로 설정 (주로 테스트용)
   */
  static setInstance(instance: IpcChannel): void {
    this._instance = instance;
  }

  /**
   * 인스턴스 캐시 클리어 (주로 테스트용)
   */
  static clearInstance(): void {
    this._instance = null;
  }

  /**
   * 현재 실행 환경을 감지하여 문자열로 반환
   */
  private static detectEnvironment(): 'electron' | 'chrome-extension' | 'web' | 'test' {
    // 테스트 환경 감지 (가장 먼저 체크)
    if (this.isTestEnvironment()) {
      return 'test';
    }

    // Electron 환경 감지
    if (this.isElectronEnvironment()) {
      return 'electron';
    }

    // Chrome Extension 환경 감지
    if (this.isChromeExtensionEnvironment()) {
      return 'chrome-extension';
    }

    // 기본값: 웹 브라우저 환경
    return 'web';
  }

  /**
   * Electron 환경인지 확인
   */
  private static isElectronEnvironment(): boolean {
    try {
      // window.electronAPI가 존재하는지 확인
      const hasElectronAPI = 
        typeof window !== 'undefined' &&
        window.electronAPI !== undefined &&
        typeof window.electronAPI === 'object';
      
      // 추가 검증: process.type이 'renderer'인지 확인
      const isRenderer = 
        typeof process !== 'undefined' && 
        process.type === 'renderer';
      
      const result = hasElectronAPI || isRenderer;
      console.log('Electron environment check:', {
        hasElectronAPI,
        isRenderer,
        result,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
      });
      
      return result;
    } catch (error) {
      console.log('Electron environment check failed:', error);
      return false;
    }
  }

  /**
   * Chrome Extension 환경인지 확인
   */
  private static isChromeExtensionEnvironment(): boolean {
    try {
      // chrome.runtime API가 존재하는지 확인
      return (
        typeof chrome !== 'undefined' &&
        chrome.runtime !== undefined &&
        chrome.runtime.id !== undefined
      );
    } catch {
      return false;
    }
  }

  /**
   * 웹 브라우저 환경인지 확인
   */
  private static isWebEnvironment(): boolean {
    try {
      // window 객체가 존재하고, electron이나 chrome extension이 아닌 경우
      return (
        typeof window !== 'undefined' &&
        !this.isElectronEnvironment() &&
        !this.isChromeExtensionEnvironment()
      );
    } catch {
      return false;
    }
  }

  /**
   * 테스트 환경인지 확인
   */
  private static isTestEnvironment(): boolean {
    try {
      // Jest, Vitest 등의 테스트 환경 감지
      return (
        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') ||
        (typeof global !== 'undefined' && (global as any).test !== undefined) ||
        (typeof window !== 'undefined' && (window as any).__testing__ === true) ||
        // Jest 환경 감지
        typeof jest !== 'undefined' ||
        // Vitest 환경 감지
        typeof vi !== 'undefined'
      );
    } catch {
      return false;
    }
  }

  /**
   * 현재 환경 정보를 반환 (디버깅용)
   */
  static getEnvironmentInfo() {
    return {
      detected: this.detectEnvironment(),
      checks: {
        isElectron: this.isElectronEnvironment(),
        isChromeExtension: this.isChromeExtensionEnvironment(),
        isWeb: this.isWebEnvironment(),
        isTest: this.isTestEnvironment(),
      },
      hasElectronAPI: typeof window !== 'undefined' && window.electronAPI !== undefined,
      hasChromeRuntime: typeof chrome !== 'undefined' && chrome.runtime !== undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'unknown',
    };
  }
}

/**
 * 간편한 IpcChannel 인스턴스 접근을 위한 헬퍼 함수
 */
export function createIpcChannel(): IpcChannel {
  return IpcChannelFactory.create();
}

/**
 * 환경 감지 결과를 확인하기 위한 헬퍼 함수 (개발/디버깅용)
 */
export function getEnvironmentInfo() {
  return IpcChannelFactory.getEnvironmentInfo();
}
