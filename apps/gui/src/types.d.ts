/**
 * Global type definitions for AgentOS GUI
 * Includes Vite environment variable injections and global objects
 */

// Vite 환경변수 주입 타입 정의
declare const __APP_ENV__: {
  buildTarget: 'electron' | 'web' | 'extension';
  nodeEnv: 'development' | 'production' | 'test';
  timestamp: string;
};

// 브라우저 환경에서 사용할 최소한의 process 객체
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      VITE_APP_ENV: string;
    }
  }

  // 개발 환경 디버깅용 전역 객체들
  interface Window {
    __agentosServices?: any;
    __debug?: {
      environment: any;
      channel: any;
      services: any;
    };

    electronAPI: AgentOsAPI;
    electronBridge?: RpcTransport;
    rpc?: {
      request: (channel: string, payload?: unknown) => Promise<unknown>;
    };
  }

  // process 객체 부분 polyfill (브라우저 환경용)
  const process: {
    env: NodeJS.ProcessEnv;
    type?: string;
    platform?: string;
  };
}

export {};
