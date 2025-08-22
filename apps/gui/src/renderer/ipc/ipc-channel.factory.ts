import type { RpcFrame } from '../../shared/rpc/rpc-frame';
import type { FrameTransport, RpcClient } from '../../shared/rpc/transport';
import { RpcEndpoint } from '../rpc/rpc-endpoint';

/**
 * 환경별 IpcChannel 구현체를 생성하는 팩토리 클래스
 * 런타임에 현재 환경을 감지하여 적절한 구현체를 반환
 */
export class RpcTransportFactory {
  private static _instance: RpcClient | null = null;
  private static getAppEnv() {
    return window.__APP_ENV__;
  }

  /**
   * 현재 환경에 맞는 IpcChannel 구현체를 생성하여 반환
   * 싱글톤 패턴으로 한 번 생성된 인스턴스를 재사용
   */
  static create(): RpcClient {
    if (RpcTransportFactory._instance) {
      return RpcTransportFactory._instance;
    }

    const environment = this.detectEnvironment();
    const envInfo = this.getEnvironmentInfo();

    console.log(`Detected environment: ${environment}`, envInfo);

    switch (environment) {
      case 'electron': {
        // Build a FrameTransport over window.electronBridge and create an RpcEndpoint
        const bridge = window.electronBridge;

        if (!bridge || typeof bridge.start !== 'function' || typeof bridge.post !== 'function') {
          throw new Error('electronBridge is not available');
        }

        const frameTransport: FrameTransport = {
          start: (onFrame: (f: RpcFrame) => void) => bridge.start(onFrame),
          post: (frame: RpcFrame) => bridge.post(frame),
          stop: () => bridge.stop?.(),
        };

        const endpoint = new RpcEndpoint(frameTransport);
        endpoint.start();

        this._instance = endpoint;

        return this._instance;
      }

      default:
        throw new Error(`Unsupported environment: ${environment}`);
    }
  }

  /**
   * 특정 구현체를 강제로 설정 (주로 테스트용)
   */
  static setInstance(instance: RpcClient): void {
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
  private static detectEnvironment(): 'electron' | 'web' | 'test' {
    // Electron 환경 감지
    if (this.isElectronEnvironment()) {
      return 'electron';
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
      const isRenderer = typeof process !== 'undefined' && process.type === 'renderer';

      const result = hasElectronAPI || isRenderer;
      console.log('Electron environment check:', {
        hasElectronAPI,
        isRenderer,
        result,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      });

      return result;
    } catch (error) {
      console.log('Electron environment check failed:', error);
      return false;
    }
  }

  /**
   * 개발 모드인지 확인 (브라우저 호환)
   */
  private static isDevelopmentMode(): boolean {
    try {
      // Vite가 주입한 환경변수 사용
      const appEnv = this.getAppEnv();
      if (appEnv && typeof appEnv.nodeEnv !== 'undefined') {
        return appEnv.nodeEnv === 'development';
      }

      // process.env가 정의되어 있다면 사용
      if (typeof process !== 'undefined' && process.env) {
        return process.env.NODE_ENV === 'development';
      }

      // 브라우저에서는 location.hostname으로 추정
      if (typeof window !== 'undefined' && window.location) {
        return (
          window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1' ||
          window.location.hostname.includes('dev')
        );
      }

      return false;
    } catch {
      return false;
    }
  }

  /**
   * 빌드 타겟 확인
   */
  private static getBuildTarget(): 'electron' | 'web' {
    try {
      // Vite가 주입한 빌드 타겟 사용
      const appEnv = this.getAppEnv();
      if (appEnv && typeof appEnv.buildTarget !== 'undefined') {
        const t = appEnv.buildTarget;
        return t === 'extension' ? 'web' : t;
      }

      // 환경 감지 결과로 추정
      const detected = this.detectEnvironment();
      if (detected === 'web') return 'web';
      return 'electron';
    } catch {
      return 'electron';
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
      },
      buildInfo: this.getAppEnv(),
      isDevelopment: this.isDevelopmentMode(),
      buildTarget: this.getBuildTarget(),
      hasElectronAPI: typeof window !== 'undefined' && window.electronAPI !== undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      nodeEnv: typeof process !== 'undefined' ? process.env?.NODE_ENV : 'unknown',
    };
  }
}

/**
 * 간편한 IpcChannel 인스턴스 접근을 위한 헬퍼 함수
 */
export function createRpcTransport(): RpcClient {
  return RpcTransportFactory.create();
}

/**
 * 환경 감지 결과를 확인하기 위한 헬퍼 함수 (개발/디버깅용)
 */
export function getEnvironmentInfo() {
  return RpcTransportFactory.getEnvironmentInfo();
}
